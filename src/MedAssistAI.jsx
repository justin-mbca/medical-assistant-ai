import React, { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import LabTrendsChart from './LabTrendsChart';
import { Search, FileText, Brain, Activity, AlertCircle, CheckCircle, Clock, Plus, Send, Download, Upload, Settings, User, Heart, Thermometer, Droplets, Zap } from 'lucide-react';


// Example medical knowledge base
const medicalKnowledge = {
  symptoms: {
    headache: { commonCauses: ['tension', 'migraine', 'dehydration'], urgency: 'low' },
    fever: { commonCauses: ['infection', 'inflammation'], urgency: 'moderate' },
    chestpain: { commonCauses: ['heart', 'muscle strain', 'anxiety'], urgency: 'high' },
    tiredness: { commonCauses: ['anemia', 'sleep deprivation', 'chronic disease'], urgency: 'moderate' },
    weakness: { commonCauses: ['electrolyte imbalance', 'infection'], urgency: 'moderate' },
  },
  drugInteractions: {
    warfarin: ['aspirin', 'ibuprofen', 'acetaminophen'],
    metformin: ['alcohol', 'contrast dye'],
    lisinopril: ['spironolactone', 'potassium supplements'],
  },
  conditions: {
    hypertension: {
      riskFactors: ['age', 'obesity', 'smoking', 'family history'],
      monitoring: 'blood pressure, kidney function',
    },
  },
};

const MedAssistAI = () => {
  // State for uploaded files
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileContents, setFileContents] = useState([]);
  const [extractedData, setExtractedData] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [symptoms, setSymptoms] = useState([]);
  const [newSymptom, setNewSymptom] = useState('');
  const [patientData, setPatientData] = useState({
    vitals: {
      heartRate: 72,
      bloodPressure: '120/80',
      temperature: 98.6,
      oxygenSat: 98
    },
    conditions: []
  });
  const [drugAnalysis, setDrugAnalysis] = useState('');
  const [riskScore, setRiskScore] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Backend URL for PDF extraction
  const PDF_BACKEND_URL = import.meta.env.VITE_PDF_BACKEND_URL || 'http://localhost:5001/extract-pdf';

  // Handle file upload
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setUploadedFiles(prev => [...prev, ...files]);
    
    files.forEach((file) => {
      if (file.name.endsWith('.docx')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const arrayBuffer = e.target.result;
          try {
            const result = await mammoth.extractRawText({ arrayBuffer });
            const content = result.value;
            setFileContents(prev => [...prev, { name: file.name, content }]);
            const data = extractLabValues(content);
            setExtractedData(prev => [...prev, { name: file.name, data }]);
          } catch (error) {
            console.error('Error processing DOCX file:', error);
          }
        };
        reader.readAsArrayBuffer(file);
      } else if (file.name.endsWith('.pdf')) {
        // Send PDF to backend for extraction
        const formData = new FormData();
        formData.append('file', file);
        fetch(PDF_BACKEND_URL, {
          method: 'POST',
          body: formData
        })
          .then(res => res.json())
          .then(data => {
            const content = data.text || '';
            setFileContents(prev => [...prev, { name: file.name, content }]);
            const labData = extractLabValues(content);
            setExtractedData(prev => [...prev, { name: file.name, data: labData }]);
          })
          .catch(error => {
            console.error('Error processing PDF file:', error);
          });
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result;
          setFileContents(prev => [...prev, { name: file.name, content }]);
          const data = extractLabValues(content);
          setExtractedData(prev => [...prev, { name: file.name, data }]);
        };
        reader.readAsText(file);
      }
    });
  };

  // Improved extraction: finds more lab values and flags abnormal results
  const extractLabValues = (text) => {
    // Add more patterns for common labs
    const patterns = [
      /glucose\s*[:\-]?\s*(\d+\.?\d*)/i,
      /hemoglobin\s*[:\-]?\s*(\d+\.?\d*)/i,
      /cholesterol\s*[:\-]?\s*(\d+\.?\d*)/i,
      /creatinine\s*[:\-]?\s*(\d+\.?\d*)/i,
      /wbc\s*[:\-]?\s*(\d+\.?\d*)/i,
      /rbc\s*[:\-]?\s*(\d+\.?\d*)/i,
      /platelet\s*[:\-]?\s*(\d+\.?\d*)/i,
      /bun\s*[:\-]?\s*(\d+\.?\d*)/i,
      /sodium\s*[:\-]?\s*(\d+\.?\d*)/i,
      /potassium\s*[:\-]?\s*(\d+\.?\d*)/i,
      /calcium\s*[:\-]?\s*(\d+\.?\d*)/i,
      /alt\s*[:\-]?\s*(\d+\.?\d*)/i,
      /ast\s*[:\-]?\s*(\d+\.?\d*)/i,
      /bilirubin\s*[:\-]?\s*(\d+\.?\d*)/i,
      /alkaline phosphatase\s*[:\-]?\s*(\d+\.?\d*)/i,
    ];
    const labels = [
      'Glucose', 'Hemoglobin', 'Cholesterol', 'Creatinine', 'WBC', 'RBC', 'Platelet', 'BUN', 'Sodium', 'Potassium', 'Calcium', 'ALT', 'AST', 'Bilirubin', 'Alkaline Phosphatase'
    ];
    // Reference ranges for flagging abnormal results
    const reference = {
      Glucose: { min: 70, max: 110 },
      Hemoglobin: { min: 12, max: 17 },
      Cholesterol: { min: 0, max: 200 },
      Creatinine: { min: 0.6, max: 1.3 },
      WBC: { min: 4, max: 11 },
      RBC: { min: 4, max: 6 },
      Platelet: { min: 150, max: 400 },
      BUN: { min: 7, max: 20 },
      Sodium: { min: 135, max: 145 },
      Potassium: { min: 3.5, max: 5.1 },
      Calcium: { min: 8.5, max: 10.5 },
      ALT: { min: 0, max: 40 },
      AST: { min: 0, max: 40 },
      Bilirubin: { min: 0.1, max: 1.2 },
      'Alkaline Phosphatase': { min: 44, max: 147 },
    };
    const results = [];
    patterns.forEach((pat, idx) => {
      const match = text.match(pat);
      if (match) {
        const label = labels[idx];
        const value = parseFloat(match[1]);
        let flag = '';
        if (reference[label]) {
          if (value < reference[label].min) flag = 'Low';
          else if (value > reference[label].max) flag = 'High';
        }
        results.push({ label, value, flag });
      }
    });
    return results;
  };

  // Risk score calculation (simple demo logic)
  const calculateRiskScore = (symptoms, vitals, conditions) => {
    let score = 0;
    let factors = [];
    if (symptoms.includes('chestpain')) {
      score += 50;
      factors.push('Chest pain');
    }
    if (vitals.heartRate > 100) {
      score += 20;
      factors.push('High heart rate');
    }
    if (vitals.temperature > 100.4) {
      score += 10;
      factors.push('Fever');
    }
    if (conditions.includes('hypertension')) {
      score += 20;
      factors.push('Hypertension');
    }
    let category = score >= 50 ? 'High Risk' : score >= 25 ? 'Moderate Risk' : 'Low Risk';
    return { score, category, factors };
  };

  // Drug Interaction Checker
  const checkDrugInteractions = (medications) => {
    const interactions = [];
    medications.forEach((med1, i) => {
      medications.forEach((med2, j) => {
        if (i !== j && medicalKnowledge.drugInteractions[med1.toLowerCase()]) {
          if (medicalKnowledge.drugInteractions[med1.toLowerCase()].includes(med2.toLowerCase())) {
            interactions.push(`${med1} may interact with ${med2}`);
          }
        }
      });
    });
    return interactions;
  };

  // Medical response generator
  const generateMedicalResponse = (input, context) => {
    const lowerInput = input.toLowerCase();
    // Drug interaction detection
    const medsMentioned = Object.keys(medicalKnowledge.drugInteractions).filter(med => lowerInput.includes(med));
    if (medsMentioned.length > 0) {
      const allMeds = medsMentioned.concat(
        Object.values(medicalKnowledge.drugInteractions).flat().filter(med => lowerInput.includes(med))
      );
      const uniqueMeds = Array.from(new Set(allMeds.map(m => m.toLowerCase())));
      const interactions = checkDrugInteractions(uniqueMeds);
      if (interactions.length > 0) {
        return `⚠️ Potential interaction: ${interactions.join('; ')}. Please consult your healthcare provider before combining these medications.`;
      } else {
        return "No known major interactions found between the medications you mentioned. Always confirm with your healthcare provider.";
      }
    }
    // Condition information detection
    const conditionMentioned = Object.keys(medicalKnowledge.conditions).find(cond => lowerInput.includes(cond));
    if (conditionMentioned) {
      const condData = medicalKnowledge.conditions[conditionMentioned];
      return `Risks of ${conditionMentioned.charAt(0).toUpperCase() + conditionMentioned.slice(1)} include: ${condData.riskFactors.join(', ')}. Monitoring is recommended: ${condData.monitoring}. Please consult your healthcare provider for personalized advice.`;
    }
    // Symptom detection
    const nlpResult = { symptoms: symptoms.filter(s => lowerInput.includes(s)) };
    if (nlpResult.symptoms.length > 0) {
      const responses = nlpResult.symptoms.map(symptom => {
        const symptomData = medicalKnowledge.symptoms[symptom];
        if (symptomData) {
          return `Symptom: "${symptom}". Possible causes: ${symptomData.commonCauses.join(', ')}. Urgency: ${symptomData.urgency}. ` +
            (symptomData.urgency === 'high' ? 'Seek immediate medical attention.' :
              symptomData.urgency === 'moderate' ? 'Consult a healthcare provider soon.' :
                'Monitor symptoms and seek care if they worsen.');
        }
        return null;
      }).filter(Boolean);
      return responses.join(' ');
    }
    if (lowerInput.includes('medication') || lowerInput.includes('drug')) {
      return "I can help analyze medication interactions and provide drug information. Please specify the medications you're asking about.";
    }
    return "I understand you're seeking medical information. Could you provide more specific symptoms or concerns so I can better assist you?";
  };

  // Chat Handler
  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;
    const userMessage = { type: 'user', content: chatInput, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);
    setTimeout(() => {
      const response = generateMedicalResponse(chatInput, { symptoms, patientData });
      const botMessage = { type: 'bot', content: response, timestamp: new Date() };
      setChatMessages(prev => [...prev, botMessage]);
      setIsProcessing(false);
    }, 1500);
    setChatInput('');
  };

  // Add Symptom
  const addSymptom = () => {
    if (newSymptom.trim() && !symptoms.includes(newSymptom.toLowerCase())) {
      setSymptoms(prev => [...prev, newSymptom.toLowerCase()]);
      setNewSymptom('');
    }
  };

  // Update risk score when symptoms change
  useEffect(() => {
    const risk = calculateRiskScore(symptoms, patientData.vitals, patientData.conditions);
    setRiskScore(risk);
  }, [symptoms, patientData]);

  // Analyze entered medications
  const handleAnalyze = () => {
    const meds = drugAnalysis.split(',').map(m => m.trim().toLowerCase()).filter(Boolean);
    if (meds.length === 0) {
      setAnalysisResult({ meds: [], interactions: [], empty: true });
      return;
    }
    const interactions = checkDrugInteractions(meds);
    setAnalysisResult({ meds, interactions, empty: false });
  };

  // Add medication to input
  const addMedToInput = (med) => {
    const current = drugAnalysis.split(',').map(m => m.trim()).filter(Boolean);
    if (!current.includes(med)) {
      setDrugAnalysis(current.concat(med).join(', '));
    }
  };

  // Common medications for user selection
  const commonMeds = [
    'Warfarin', 'Aspirin', 'Ibuprofen', 'Acetaminophen', 'Lisinopril', 'Metformin', 'Spironolactone', 'Potassium supplements', 'Contrast dye', 'Alcohol'
  ];

  // Default doses for recognized drugs
  const defaultDoses = {
    warfarin: '5mg',
    aspirin: '81mg',
    ibuprofen: '200mg',
    acetaminophen: '500mg',
    lisinopril: '10mg',
    metformin: '500mg',
    spironolactone: '25mg',
    'potassium supplements': '20mEq',
    'contrast dye': 'N/A',
    alcohol: 'N/A',
  };

  // Sample analysis now uses entered medications
  const enteredMeds = drugAnalysis.split(',').map(m => m.trim()).filter(Boolean);
  const sampleMedications = enteredMeds.length > 0 ? enteredMeds : ['Warfarin', 'Lisinopril', 'Metformin'];
  const sampleInteractions = checkDrugInteractions(sampleMedications);

  // Render functions for different tabs
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Risk Assessment */}
      {riskScore && (
        <div className={`p-6 rounded-lg shadow-md ${
          riskScore.category === 'High Risk' ? 'bg-red-100 border border-red-300' :
          riskScore.category === 'Moderate Risk' ? 'bg-yellow-100 border border-yellow-300' :
          'bg-green-100 border border-green-300'
        }`}>
          <h3 className="text-xl font-semibold mb-2 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Risk Assessment
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{riskScore.category}</p>
              <p className="text-sm">Score: {riskScore.score}/100</p>
              {riskScore.factors.length > 0 && (
                <p className="text-sm mt-1">Factors: {riskScore.factors.join(', ')}</p>
              )}
            </div>
            {riskScore.category === 'High Risk' ? (
              <AlertCircle className="w-8 h-8 text-red-600" />
            ) : riskScore.category === 'Moderate Risk' ? (
              <Clock className="w-8 h-8 text-yellow-600" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-600" />
            )}
          </div>
        </div>
      )}

      {/* Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <Heart className="w-8 h-8 text-red-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Heart Rate</p>
              <p className="text-xl font-semibold">{patientData.vitals.heartRate} bpm</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Blood Pressure</p>
              <p className="text-xl font-semibold">{patientData.vitals.bloodPressure}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <Thermometer className="w-8 h-8 text-orange-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Temperature</p>
              <p className="text-xl font-semibold">{patientData.vitals.temperature}°F</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <Droplets className="w-8 h-8 text-cyan-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Oxygen Sat</p>
              <p className="text-xl font-semibold">{patientData.vitals.oxygenSat}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Symptoms */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Current Symptoms
        </h3>
        {/* Common Symptoms List */}
        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Common Symptoms:</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(medicalKnowledge.symptoms).map((symptom) => (
              <button
                key={symptom}
                onClick={() => {
                  if (!symptoms.includes(symptom)) setSymptoms(prev => [...prev, symptom]);
                }}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  symptoms.includes(symptom)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200'
                }`}
              >
                {symptom.charAt(0).toUpperCase() + symptom.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {symptoms.map((symptom, idx) => (
            <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {symptom}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSymptom}
            onChange={(e) => setNewSymptom(e.target.value)}
            placeholder="Add a symptom..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
          />
          <button
            onClick={addSymptom}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderAIChat = () => (
    <div className="bg-white rounded-lg shadow-md h-96 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-xl font-semibold flex items-center">
          <Brain className="w-5 h-5 mr-2" />
          AI Medical Assistant
        </h3>
      </div>

      {/* Example prompts */}
      <div className="px-4 pt-4 pb-2 border-b border-gray-100">
        <p className="text-sm text-gray-600 mb-2">Try one of these examples:</p>
        <div className="flex flex-wrap gap-2">
          {[
            "I have a headache and fever",
            "Can I take ibuprofen with warfarin?",
            "What should I do for chest pain?",
            "What are the risks of hypertension?",
            "I'm feeling tired and weak",
            "Is it safe to combine metformin and alcohol?"
          ].map((example, idx) => (
            <button
              key={idx}
              onClick={() => setChatInput(example)}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm border border-blue-200 hover:bg-blue-200 transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <Brain className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Start a conversation with your AI medical assistant</p>
          </div>
        )}

        {chatMessages.map((message, idx) => (
          <div key={idx} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-4 py-2 rounded-lg ${
              message.type === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              <p className="text-sm">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask about symptoms, medications, or health concerns..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
          />
          <button
            onClick={handleChatSubmit}
            disabled={!chatInput.trim() || isProcessing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderDrugAnalysis = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          Drug Interaction Analysis
        </h3>

        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Common Medications:</p>
          <div className="flex flex-wrap gap-2">
            {commonMeds.map((med, idx) => (
              <button
                key={idx}
                onClick={() => addMedToInput(med)}
                className="px-3 py-1 rounded-full text-sm border transition-colors bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200"
              >
                {med}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-2">
          <label className="block text-sm font-medium mb-2">Enter medications (comma separated):</label>
          <textarea
            value={drugAnalysis}
            onChange={(e) => setDrugAnalysis(e.target.value)}
            placeholder="e.g., Warfarin, Aspirin, Lisinopril"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
          />
        </div>
        <button
          onClick={handleAnalyze}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Analyze
        </button>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h4 className="font-medium text-yellow-800 mb-2">Analysis Results</h4>
            <div className="space-y-2">
              {analysisResult.empty ? (
                <p className="text-sm text-yellow-700">Please enter one or more medications to analyze interactions.</p>
              ) : (
                <>
                  <p className="text-sm text-yellow-700">Medications analyzed: {analysisResult.meds.join(', ')}</p>
                  {analysisResult.interactions.length > 0 ? (
                    <div>
                      <p className="font-medium text-yellow-800">⚠️ Potential Interactions Found:</p>
                      <ul className="list-disc list-inside text-sm text-yellow-700 mt-2">
                        {analysisResult.interactions.map((interaction, idx) => (
                          <li key={idx}>{interaction}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-green-700">✅ No known interactions found</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Sample Analysis: Now uses entered medications */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-4">
          <h4 className="font-medium text-yellow-800 mb-2">Sample Analysis: {enteredMeds.length > 0 ? 'Your Medications' : 'Common Medications'}</h4>
          <div className="space-y-2">
            <p className="text-sm text-yellow-700">Medications analyzed: {sampleMedications.join(', ')}</p>
            {sampleInteractions.length > 0 ? (
              <div>
                <p className="font-medium text-yellow-800">⚠️ Potential Interactions Found:</p>
                <ul className="list-disc list-inside text-sm text-yellow-700 mt-2">
                  {sampleInteractions.map((interaction, idx) => (
                    <li key={idx}>{interaction}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-green-700">✅ No known interactions found</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">Medication Adherence Tracking</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Morning', 'Afternoon', 'Evening'].map((time) => (
            <div key={time} className="border border-gray-200 rounded-md p-4">
              <h4 className="font-medium mb-2">{time} Medications</h4>
              <div className="space-y-2">
                {enteredMeds.length === 0 ? (
                  <span className="text-sm text-gray-400">No medications entered</span>
                ) : (
                  enteredMeds.map((med, idx) => {
                    const dose = defaultDoses[med.toLowerCase()] || 'N/A';
                    return (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm">{med} <span className="text-xs text-gray-500">({dose})</span></span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  
  const renderHealthRecords = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <FileText className="w-5 h-5 mr-2" />
        Health Records Management
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Upload medical documents, lab results, or imaging files</p>
          <input
            type="file"
            multiple
            style={{ display: 'none' }}
            id="file-upload-input"
            onChange={handleFileUpload}
          />
          <label htmlFor="file-upload-input">
            <span className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer inline-block">
              Choose Files
            </span>
          </label>
          {uploadedFiles.length > 0 && (
            <div className="mt-4 text-left">
              <h4 className="font-medium mb-2">Uploaded Files:</h4>
              <ul className="list-disc list-inside text-sm mb-2">
                {uploadedFiles.map((file, idx) => (
                  <li key={idx}>{file.name}</li>
                ))}
              </ul>
              {/* Display file contents for text files */}
              {fileContents.map((file, idx) => (
                <div key={idx} className="mb-4 p-2 border rounded bg-gray-50">
                  <h5 className="font-semibold text-xs mb-1">{file.name} Contents:</h5>
                  <pre className="text-xs whitespace-pre-wrap">{file.content}</pre>
                  {/* Extracted lab values with flags and chart */}
                  {extractedData[idx] && extractedData[idx].data.length > 0 && (
                    <div className="mt-2">
                      <h6 className="font-semibold text-xs mb-1">Extracted Lab Values:</h6>
                      <ul className="list-disc list-inside text-xs">
                        {extractedData[idx].data.map((item, i) => (
                          <li key={i}>
                            {item.label}: {item.value}
                            {item.flag && (
                              <span className={`ml-2 px-2 py-0.5 rounded text-white text-xs ${item.flag === 'High' ? 'bg-red-500' : 'bg-yellow-500'}`}>{item.flag}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                      {/* Chart visualization */}
                      <div className="mt-4">
                        <LabTrendsChart labData={extractedData[idx].data} />
                      </div>
                      {/* Summary of abnormal results */}
                      {extractedData[idx].data.some(item => item.flag) && (
                        <div className="mt-2 text-xs text-red-600 font-semibold">
                          Abnormal Results: {extractedData[idx].data.filter(item => item.flag).map(item => `${item.label} (${item.flag})`).join(', ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-4">
          <h4 className="font-medium">Recent Records</h4>
          <div className="space-y-2">
            {['Blood Test Results - Jan 2025', 'X-Ray Report - Dec 2024', 'Cardiology Consultation - Nov 2024'].map((record, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                <span className="text-sm">{record}</span>
                <Download className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-blue-600 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">MedAssist AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <User className="w-6 h-6 text-gray-600" />
              <Settings className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'chat', label: 'AI Assistant', icon: Brain },
              { id: 'analysis', label: 'Drug Analysis', icon: Search },
              { id: 'records', label: 'Health Records', icon: FileText }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'chat' && renderAIChat()}
        {activeTab === 'analysis' && renderDrugAnalysis()}
        {activeTab === 'records' && renderHealthRecords()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            MedAssist AI - Healthcare Intelligence Platform. For educational purposes only. Always consult healthcare professionals for medical advice.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MedAssistAI;