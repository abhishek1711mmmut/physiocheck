import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

export default function AssessmentForm() {
  const { id: patientId, specialtyId } = useParams();
  const navigate = useNavigate();
  const [specialty, setSpecialty] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [commonFields, setCommonFields] = useState({
    patientName: '', age: '', gender: '', diagnosis: '', vas: '', nprs: ''
  });
  const [findings, setFindings] = useState({});
  const [specialTestResults, setSpecialTestResults] = useState({});
  const [outcomeScores, setOutcomeScores] = useState({});
  const [notes, setNotes] = useState('');
  const [problemList, setProblemList] = useState([]);
  const [goals, setGoals] = useState({ shortTerm: [''], longTerm: [''] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [specRes, patRes] = await Promise.all([
          api.get(`/specialties/${specialtyId}`),
          api.get(`/patients/${patientId}`)
        ]);
        setSpecialty(specRes.data.data);
        setPatient(patRes.data.data);
        setCommonFields({
          patientName: patRes.data.data.name,
          age: patRes.data.data.age,
          gender: patRes.data.data.gender,
          diagnosis: '',
          vas: '',
          nprs: ''
        });
      } catch (err) {
        console.error('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patientId, specialtyId]);

  const updateFinding = (sectionTitle, subsectionTitle, fieldLabel, value) => {
    const key = `${sectionTitle}|${subsectionTitle}|${fieldLabel}`;
    setFindings(prev => ({ ...prev, [key]: value }));
  };

  const updateTestResult = (testName, value) => {
    setSpecialTestResults(prev => ({ ...prev, [testName]: value }));
  };

  const updateOutcomeScore = (measureName, value) => {
    setOutcomeScores(prev => ({ ...prev, [measureName]: value }));
  };

  const generateProblems = () => {
    const problems = [];
    const vas = Number(commonFields.vas);
    const nprs = Number(commonFields.nprs);

    if (vas >= 7 || nprs >= 7) problems.push('Severe pain');
    else if (vas >= 4 || nprs >= 4) problems.push('Moderate pain');
    else if (vas >= 1 || nprs >= 1) problems.push('Mild pain');

    Object.entries(findings).forEach(([key, value]) => {
      const label = key.split('|').pop();
      if (value === true) {
        if (['Swelling', 'Muscle wasting', 'Deformity', 'Stiffness', 'Instability'].includes(label)) {
          problems.push(label);
        }
        if (['Spasticity', 'Rigidity', 'Hypotonia'].includes(label)) {
          problems.push(`Abnormal tone - ${label}`);
        }
      }
      if (typeof value === 'string' && value.toLowerCase().includes('impaired')) {
        problems.push(`Impaired ${label.toLowerCase()}`);
      }
      if (typeof value === 'string' && value.toLowerCase().includes('reduced')) {
        problems.push(`Reduced ${label.toLowerCase()}`);
      }
    });

    Object.entries(specialTestResults).forEach(([name, result]) => {
      if (result === 'Positive') problems.push(`Positive ${name}`);
    });

    setProblemList(prev => [...new Set([...prev, ...problems])]);
  };

  const addProblem = () => setProblemList(prev => [...prev, '']);
  const updateProblem = (index, value) => setProblemList(prev => prev.map((p, i) => i === index ? value : p));
  const removeProblem = (index) => setProblemList(prev => prev.filter((_, i) => i !== index));

  const addGoal = (type) => setGoals(prev => ({ ...prev, [type]: [...prev[type], ''] }));
  const updateGoal = (type, index, value) => setGoals(prev => ({
    ...prev, [type]: prev[type].map((g, i) => i === index ? value : g)
  }));
  const removeGoal = (type, index) => setGoals(prev => ({
    ...prev, [type]: prev[type].filter((_, i) => i !== index)
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const assessment = await api.post('/assessments', {
        patientId,
        specialtyId,
        specialtyName: specialty.name,
        commonFields: {
          ...commonFields,
          age: Number(commonFields.age),
          vas: commonFields.vas ? Number(commonFields.vas) : null,
          nprs: commonFields.nprs ? Number(commonFields.nprs) : null
        },
        findings,
        specialTestResults,
        outcomeScores,
        problemList: problemList.filter(p => p.trim()),
        goals: {
          shortTerm: goals.shortTerm.filter(g => g.trim()),
          longTerm: goals.longTerm.filter(g => g.trim())
        },
        notes
      });
      toast.success('Assessment saved successfully');
      navigate(`/patients/${patientId}/assessments/${assessment.data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (sectionTitle, subsectionTitle, field) => {
    const key = `${sectionTitle}|${subsectionTitle}|${field.label}`;
    const value = findings[key] || '';

    switch (field.type) {
      case 'checkbox':
        return (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!value}
              onChange={(e) => updateFinding(sectionTitle, subsectionTitle, field.label, e.target.checked)}
              className="w-4 h-4 text-blue-600" />
            <span className="text-sm">{field.label}</span>
          </label>
        );
      case 'dropdown':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            <select value={value}
              onChange={(e) => updateFinding(sectionTitle, subsectionTitle, field.label, e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select</option>
              {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        );
      case 'textarea':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            <textarea value={value} rows={2}
              onChange={(e) => updateFinding(sectionTitle, subsectionTitle, field.label, e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        );
      case 'number':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            <input type="number" value={value}
              onChange={(e) => updateFinding(sectionTitle, subsectionTitle, field.label, e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        );
      default:
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
            <input type="text" value={value}
              onChange={(e) => updateFinding(sectionTitle, subsectionTitle, field.label, e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        );
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!specialty || !patient) return <div className="text-center py-10">Not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">{specialty.icon} {specialty.name} Assessment</h1>
      <p className="text-gray-600 mb-6">Patient: {patient.name}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Common Fields */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Patient Information</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={commonFields.patientName} readOnly
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input type="number" value={commonFields.age} readOnly
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <input type="text" value={commonFields.gender} readOnly
                className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">VAS (0-10)</label>
              <input type="number" min="0" max="10" value={commonFields.vas}
                onChange={(e) => setCommonFields(prev => ({ ...prev, vas: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NPRS (0-10)</label>
              <input type="number" min="0" max="10" value={commonFields.nprs}
                onChange={(e) => setCommonFields(prev => ({ ...prev, nprs: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Dynamic Sections */}
        {specialty.sections.map((section) => (
          <div key={section.title} className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">{section.title}</h2>
            {section.subsections.map((sub) => (
              <div key={sub.title} className="mb-4">
                <h3 className="text-md font-medium text-gray-700 mb-3 border-b pb-1">{sub.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sub.fields.map((field) => (
                    <div key={field.label}>
                      {renderField(section.title, sub.title, field)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Special Tests */}
        {specialty.specialTests.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Special Tests</h2>
            {specialty.specialTests.map((group) => (
              <div key={group.group} className="mb-4">
                <h3 className="text-md font-medium text-gray-700 mb-3 border-b pb-1">{group.group}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {group.tests.map((test) => (
                    <div key={test.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{test.name}</label>
                      <select value={specialTestResults[test.name] || ''}
                        onChange={(e) => updateTestResult(test.name, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Not tested</option>
                        {test.resultOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Outcome Measures */}
        {specialty.outcomeMeasures.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Outcome Measures</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {specialty.outcomeMeasures.map((measure) => (
                <div key={measure.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {measure.name}
                    {measure.maxScore && <span className="text-gray-400"> (max: {measure.maxScore})</span>}
                    {measure.unit && <span className="text-gray-400"> ({measure.unit})</span>}
                  </label>
                  <input type="number" value={outcomeScores[measure.name] || ''}
                    onChange={(e) => updateOutcomeScore(measure.name, e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Diagnosis */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Diagnosis</h2>
          <textarea rows={2} value={commonFields.diagnosis}
            onChange={(e) => setCommonFields(prev => ({ ...prev, diagnosis: e.target.value }))}
            placeholder="Enter diagnosis based on assessment findings..."
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {/* Problem List */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Problem List</h2>
            <div className="flex gap-2">
              <button type="button" onClick={generateProblems}
                className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 cursor-pointer">
                Auto-Suggest
              </button>
              <button type="button" onClick={addProblem}
                className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 cursor-pointer">
                + Add
              </button>
            </div>
          </div>
          {problemList.map((problem, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <span className="text-sm text-gray-500 py-2">{i + 1}.</span>
              <input type="text" value={problem}
                onChange={(e) => updateProblem(i, e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={() => removeProblem(i)}
                className="text-red-500 hover:text-red-700 text-sm px-2 cursor-pointer">Remove</button>
            </div>
          ))}
        </div>

        {/* Goals */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Treatment Goals</h2>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-medium text-gray-700">Short-term Goals</h3>
              <button type="button" onClick={() => addGoal('shortTerm')}
                className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 cursor-pointer">+ Add</button>
            </div>
            {goals.shortTerm.map((goal, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input type="text" value={goal} placeholder="e.g., Reduce pain to 4/10"
                  onChange={(e) => updateGoal('shortTerm', i, e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => removeGoal('shortTerm', i)}
                  className="text-red-500 hover:text-red-700 text-sm px-2 cursor-pointer">Remove</button>
              </div>
            ))}
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-medium text-gray-700">Long-term Goals</h3>
              <button type="button" onClick={() => addGoal('longTerm')}
                className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 cursor-pointer">+ Add</button>
            </div>
            {goals.longTerm.map((goal, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input type="text" value={goal} placeholder="e.g., Independent walking without aid"
                  onChange={(e) => updateGoal('longTerm', i, e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button type="button" onClick={() => removeGoal('longTerm', i)}
                  className="text-red-500 hover:text-red-700 text-sm px-2 cursor-pointer">Remove</button>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Therapist Notes</h2>
          <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes..."
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <button type="submit" disabled={submitting}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-400 cursor-pointer">
          {submitting ? 'Saving...' : 'Submit Assessment'}
        </button>
      </form>
    </div>
  );
}
