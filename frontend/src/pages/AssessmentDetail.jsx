import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { generatePDF } from '../utils/pdfGenerator';
import { formatDate } from '../utils/formatDate';

export default function AssessmentDetail() {
  const { id: patientId, assessmentId } = useParams();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const res = await api.get(`/assessments/${assessmentId}`);
        setAssessment(res.data.data);
      } catch (err) {
        console.error('Failed to fetch assessment');
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, [assessmentId]);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!assessment) return <div className="text-center py-10">Assessment not found</div>;

  const { commonFields, findings, specialTestResults, outcomeScores, notes } = assessment;

  const filledFindings = Object.entries(findings || {}).filter(([, v]) => v && v !== false);
  const filledTests = Object.entries(specialTestResults || {}).filter(([, v]) => v);
  const filledScores = Object.entries(outcomeScores || {}).filter(([, v]) => v);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{assessment.specialtyName} Assessment</h1>
          <p className="text-gray-600">{formatDate(assessment.date)}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => generatePDF(assessment)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm cursor-pointer">
            Download PDF
          </button>
          <Link to={`/patients/${patientId}`} className="text-blue-600 hover:underline py-2">Back to Patient</Link>
        </div>
      </div>

      {/* Patient Info */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-3">Patient Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Name:</span> {commonFields?.patientName}</div>
          <div><span className="text-gray-500">Age:</span> {commonFields?.age}</div>
          <div><span className="text-gray-500">Gender:</span> {commonFields?.gender}</div>
          <div><span className="text-gray-500">Diagnosis:</span> {commonFields?.diagnosis || 'N/A'}</div>
          <div><span className="text-gray-500">VAS:</span> {commonFields?.vas ?? 'N/A'}/10</div>
          <div><span className="text-gray-500">NPRS:</span> {commonFields?.nprs ?? 'N/A'}/10</div>
        </div>
      </div>

      {/* Findings */}
      {filledFindings.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-3">Assessment Findings</h2>
          <div className="space-y-2 text-sm">
            {filledFindings.map(([key, value]) => {
              const parts = key.split('|');
              const label = parts[parts.length - 1];
              const section = parts[0];
              return (
                <div key={key} className="flex justify-between border-b pb-1">
                  <span className="text-gray-600">{section} &gt; {label}</span>
                  <span className="font-medium">{value === true ? 'Present' : value}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Special Tests */}
      {filledTests.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-3">Special Test Results</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {filledTests.map(([name, result]) => (
              <div key={name} className="flex justify-between border-b pb-1">
                <span className="text-gray-600">{name}</span>
                <span className="font-medium">{result}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outcome Scores */}
      {filledScores.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-3">Outcome Measure Scores</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {filledScores.map(([name, score]) => (
              <div key={name} className="flex justify-between border-b pb-1">
                <span className="text-gray-600">{name}</span>
                <span className="font-medium">{score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Problem List */}
      {assessment.problemList?.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-3">Problem List</h2>
          <ol className="list-decimal list-inside text-sm space-y-1">
            {assessment.problemList.map((p, i) => <li key={i}>{p}</li>)}
          </ol>
        </div>
      )}

      {/* Goals */}
      {(assessment.goals?.shortTerm?.length > 0 || assessment.goals?.longTerm?.length > 0) && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-3">Treatment Goals</h2>
          {assessment.goals.shortTerm?.length > 0 && (
            <div className="mb-3">
              <h3 className="text-md font-medium text-gray-700 mb-1">Short-term</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                {assessment.goals.shortTerm.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
            </div>
          )}
          {assessment.goals.longTerm?.length > 0 && (
            <div>
              <h3 className="text-md font-medium text-gray-700 mb-1">Long-term</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                {assessment.goals.longTerm.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {notes && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-3">Therapist Notes</h2>
          <p className="text-sm whitespace-pre-wrap">{notes}</p>
        </div>
      )}
    </div>
  );
}
