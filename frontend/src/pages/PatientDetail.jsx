import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { formatDate } from '../utils/formatDate';

export default function PatientDetail() {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientRes, assessmentsRes] = await Promise.all([
          api.get(`/patients/${id}`),
          api.get(`/assessments/patient/${id}`)
        ]);
        setPatient(patientRes.data.data);
        setAssessments(assessmentsRes.data.data);
      } catch (err) {
        console.error('Failed to fetch patient data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!patient) return <div className="text-center py-10">Patient not found</div>;

  const sortedAssessments = [...assessments].sort((a, b) => new Date(a.date) - new Date(b.date));

  const painChartData = sortedAssessments
    .filter(a => a.commonFields?.vas != null || a.commonFields?.nprs != null)
    .map(a => ({
      date: formatDate(a.date),
      VAS: a.commonFields?.vas,
      NPRS: a.commonFields?.nprs
    }));

  const allOutcomeNames = [...new Set(sortedAssessments.flatMap(a => Object.keys(a.outcomeScores || {})))];
  const outcomeChartData = sortedAssessments.map(a => {
    const row = { date: formatDate(a.date) };
    allOutcomeNames.forEach(name => {
      if (a.outcomeScores?.[name]) row[name] = Number(a.outcomeScores[name]);
    });
    return row;
  });

  const colors = ['#2563eb', '#16a34a', '#dc2626', '#9333ea', '#f59e0b', '#06b6d4', '#ec4899'];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h1 className="text-2xl font-bold mb-4">{patient.name}</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-gray-500">Age:</span> {patient.age}</div>
          <div><span className="text-gray-500">Gender:</span> {patient.gender}</div>
          <div><span className="text-gray-500">Date:</span> {formatDate(patient.date)}</div>
        </div>
      </div>

      {/* Progress Charts */}
      {painChartData.length > 1 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Pain Progress</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={painChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis domain={[0, 10]} fontSize={12} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="VAS" stroke="#2563eb" strokeWidth={2} />
              <Line type="monotone" dataKey="NPRS" stroke="#dc2626" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {outcomeChartData.length > 1 && allOutcomeNames.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Outcome Measures Progress</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={outcomeChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              {allOutcomeNames.map((name, i) => (
                <Line key={name} type="monotone" dataKey={name}
                  stroke={colors[i % colors.length]} strokeWidth={2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Comparison Table */}
      {sortedAssessments.length > 1 && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Assessment Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Parameter</th>
                  {sortedAssessments.map((a, i) => (
                    <th key={a._id} className="text-center py-2 px-2">
                      {i === 0 ? 'Initial' : `Visit ${i + 1}`}<br />
                      <span className="text-xs text-gray-500">{formatDate(a.date)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 pr-4 text-gray-600">VAS</td>
                  {sortedAssessments.map(a => (
                    <td key={a._id} className="text-center py-2">{a.commonFields?.vas ?? '-'}</td>
                  ))}
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 text-gray-600">NPRS</td>
                  {sortedAssessments.map(a => (
                    <td key={a._id} className="text-center py-2">{a.commonFields?.nprs ?? '-'}</td>
                  ))}
                </tr>
                {allOutcomeNames.map(name => (
                  <tr key={name} className="border-b">
                    <td className="py-2 pr-4 text-gray-600">{name}</td>
                    {sortedAssessments.map(a => (
                      <td key={a._id} className="text-center py-2">{a.outcomeScores?.[name] ?? '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Assessments</h2>
        <Link to={`/patients/${id}/assess`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          New Assessment
        </Link>
      </div>

      {assessments.length === 0 ? (
        <p className="text-gray-500 bg-white p-6 rounded-lg shadow">No assessments yet.</p>
      ) : (
        <div className="space-y-3">
          {assessments.map((a) => (
            <Link key={a._id} to={`/patients/${id}/assessments/${a._id}`}
              className="block bg-white p-4 rounded-lg shadow hover:shadow-md">
              <div className="flex justify-between">
                <span className="font-medium">{a.specialtyName}</span>
                <span className="text-gray-500 text-sm">{formatDate(a.date)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
