const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const Specialty = require('../models/Specialty');

const specialties = [
  {
    name: 'Orthopaedic',
    icon: '🦴',
    sections: [
      {
        title: 'Assessment (Subjective)',
        subsections: [
          {
            title: 'Subjective Complaints',
            fields: [
              { label: 'Pain', type: 'checkbox' },
              { label: 'Stiffness', type: 'checkbox' },
              { label: 'Swelling', type: 'checkbox' },
              { label: 'Instability', type: 'checkbox' },
              { label: 'Locking', type: 'checkbox' },
              { label: 'Clicking', type: 'checkbox' },
              { label: 'Giving way', type: 'checkbox' },
              { label: 'Functional limitations', type: 'textarea' }
            ]
          }
        ]
      },
      {
        title: 'History',
        subsections: [
          {
            title: 'History',
            fields: [
              { label: 'Trauma/mechanism of injury', type: 'textarea' },
              { label: 'Previous fracture', type: 'checkbox' },
              { label: 'Surgery', type: 'textarea' },
              { label: 'Immobilization', type: 'checkbox' },
              { label: 'Sports/work demands', type: 'textarea' }
            ]
          }
        ]
      },
      {
        title: 'Physical Examination',
        subsections: [
          {
            title: 'Observation',
            fields: [
              { label: 'Posture', type: 'textarea' },
              { label: 'Swelling', type: 'checkbox' },
              { label: 'Deformity', type: 'checkbox' },
              { label: 'Muscle wasting', type: 'checkbox' },
              { label: 'Scar', type: 'checkbox' },
              { label: 'Redness', type: 'checkbox' },
              { label: 'Bruising', type: 'checkbox' },
              { label: 'Limb alignment', type: 'textarea' }
            ]
          },
          {
            title: 'Palpation',
            fields: [
              { label: 'Temperature', type: 'dropdown', options: ['Normal', 'Warm', 'Hot'] },
              { label: 'Tenderness', type: 'textarea' },
              { label: 'Swelling', type: 'dropdown', options: ['None', 'Mild', 'Moderate', 'Severe'] },
              { label: 'Bony landmarks', type: 'textarea' },
              { label: 'Muscle spasm', type: 'checkbox' }
            ]
          },
          {
            title: 'ROM',
            fields: [
              { label: 'Active ROM', type: 'textarea' },
              { label: 'Passive ROM', type: 'textarea' },
              { label: 'End-feel', type: 'textarea' },
              { label: 'Painful arc', type: 'checkbox' }
            ]
          },
          {
            title: 'Muscle Examination',
            fields: [
              { label: 'MMT', type: 'textarea' },
              { label: 'Isometric strength', type: 'textarea' },
              { label: 'Functional strength', type: 'textarea' }
            ]
          },
          {
            title: 'Neurological Screening',
            fields: [
              { label: 'Dermatomes', type: 'textarea' },
              { label: 'Myotomes', type: 'textarea' },
              { label: 'Reflexes', type: 'textarea' },
              { label: 'Neural tension', type: 'textarea' }
            ]
          },
          {
            title: 'Functional Assessment',
            fields: [
              { label: 'Walking', type: 'textarea' },
              { label: 'Stairs', type: 'textarea' },
              { label: 'Sit-to-stand', type: 'textarea' },
              { label: 'Squat', type: 'textarea' },
              { label: 'ADLs', type: 'textarea' }
            ]
          }
        ]
      }
    ],
    specialTests: [
      {
        group: 'Knee',
        tests: [
          { name: 'Lachman' },
          { name: 'Anterior drawer' },
          { name: 'Posterior drawer' },
          { name: 'McMurray' },
          { name: 'Thessaly' },
          { name: 'Varus stress' },
          { name: 'Valgus stress' },
          { name: 'Patellar apprehension' }
        ]
      },
      {
        group: 'Shoulder',
        tests: [
          { name: 'Neer' },
          { name: 'Hawkins-Kennedy' },
          { name: 'Empty Can/Jobe' },
          { name: 'Drop Arm' },
          { name: 'Apprehension/relocation' },
          { name: "Speed's" }
        ]
      },
      {
        group: 'Hip',
        tests: [
          { name: 'FABER' },
          { name: 'FADIR' },
          { name: 'Thomas test' },
          { name: 'Trendelenburg' }
        ]
      },
      {
        group: 'Spine',
        tests: [
          { name: 'SLR' },
          { name: 'Slump' },
          { name: 'Prone instability' },
          { name: 'Spurling' },
          { name: 'Cervical distraction' }
        ]
      },
      {
        group: 'Ankle',
        tests: [
          { name: 'Anterior drawer' },
          { name: 'Talar tilt' },
          { name: 'Thompson test' }
        ]
      }
    ],
    outcomeMeasures: [
      { name: 'LEFS', maxScore: 80 },
      { name: 'DASH/QuickDASH', maxScore: 100 },
      { name: 'SPADI', maxScore: 130 },
      { name: 'WOMAC', maxScore: 96 },
      { name: 'KOOS', maxScore: 100 },
      { name: 'ODI', maxScore: 100, unit: '%' },
      { name: 'NDI', maxScore: 100, unit: '%' }
    ]
  },
  {
    name: 'Neurological',
    icon: '🧠',
    sections: [
      {
        title: 'History',
        subsections: [
          {
            title: 'History',
            fields: [
              { label: 'Onset', type: 'textarea' },
              { label: 'Progression', type: 'textarea' },
              { label: 'Falls', type: 'checkbox' },
              { label: 'Seizures', type: 'checkbox' },
              { label: 'Sensory symptoms', type: 'textarea' },
              { label: 'Bladder/bowel', type: 'textarea' },
              { label: 'Speech/swallowing problems', type: 'checkbox' },
              { label: 'Mobility level', type: 'textarea' }
            ]
          }
        ]
      },
      {
        title: 'Examination',
        subsections: [
          {
            title: 'Mental Status',
            fields: [
              { label: 'Consciousness', type: 'textarea' },
              { label: 'Orientation', type: 'textarea' },
              { label: 'Memory', type: 'textarea' },
              { label: 'Attention', type: 'textarea' },
              { label: 'Cognition', type: 'textarea' }
            ]
          },
          {
            title: 'Cranial Nerves',
            fields: [
              { label: 'CN I–XII screening', type: 'textarea' }
            ]
          },
          {
            title: 'Motor Examination',
            fields: [
              { label: 'Muscle bulk', type: 'textarea' },
              { label: 'Tone', type: 'textarea' },
              { label: 'Power', type: 'textarea' },
              { label: 'Involuntary movements', type: 'checkbox' }
            ]
          },
          {
            title: 'Tone',
            fields: [
              { label: 'Hypotonia', type: 'checkbox' },
              { label: 'Spasticity', type: 'checkbox' },
              { label: 'Rigidity', type: 'checkbox' }
            ]
          },
          {
            title: 'Reflexes',
            fields: [
              { label: 'Biceps', type: 'dropdown', options: ['0', '1+', '2+', '3+', '4+'] },
              { label: 'Triceps', type: 'dropdown', options: ['0', '1+', '2+', '3+', '4+'] },
              { label: 'Supinator', type: 'dropdown', options: ['0', '1+', '2+', '3+', '4+'] },
              { label: 'Knee', type: 'dropdown', options: ['0', '1+', '2+', '3+', '4+'] },
              { label: 'Ankle', type: 'dropdown', options: ['0', '1+', '2+', '3+', '4+'] },
              { label: 'Plantar response', type: 'dropdown', options: ['Flexor', 'Extensor', 'Equivocal'] }
            ]
          },
          {
            title: 'Sensory',
            fields: [
              { label: 'Light touch', type: 'dropdown', options: ['Normal', 'Impaired', 'Absent'] },
              { label: 'Pain', type: 'dropdown', options: ['Normal', 'Impaired', 'Absent'] },
              { label: 'Temperature', type: 'dropdown', options: ['Normal', 'Impaired', 'Absent'] },
              { label: 'Vibration', type: 'dropdown', options: ['Normal', 'Impaired', 'Absent'] },
              { label: 'Proprioception', type: 'dropdown', options: ['Normal', 'Impaired', 'Absent'] },
              { label: 'Cortical sensation', type: 'textarea' }
            ]
          },
          {
            title: 'Coordination',
            fields: [
              { label: 'Finger-to-nose', type: 'dropdown', options: ['Normal', 'Impaired'] },
              { label: 'Heel-to-shin', type: 'dropdown', options: ['Normal', 'Impaired'] },
              { label: 'Rapid alternating movements', type: 'dropdown', options: ['Normal', 'Impaired'] }
            ]
          },
          {
            title: 'Balance',
            fields: [
              { label: 'Sitting', type: 'dropdown', options: ['Independent', 'With support', 'Unable'] },
              { label: 'Standing', type: 'dropdown', options: ['Independent', 'With support', 'Unable'] },
              { label: 'Dynamic balance', type: 'textarea' }
            ]
          },
          {
            title: 'Gait',
            fields: [
              { label: 'Gait pattern', type: 'textarea' },
              { label: 'Step length', type: 'textarea' },
              { label: 'Cadence', type: 'textarea' },
              { label: 'Assistive device', type: 'textarea' }
            ]
          }
        ]
      }
    ],
    specialTests: [
      {
        group: 'General Scales',
        tests: [
          { name: 'Glasgow Coma Scale', resultOptions: ['3-8 Severe', '9-12 Moderate', '13-15 Mild'] },
          { name: 'Modified Ashworth Scale', resultOptions: ['0', '1', '1+', '2', '3', '4'] },
          { name: 'Berg Balance Scale', resultOptions: ['0-20 High fall risk', '21-40 Medium fall risk', '41-56 Low fall risk'] },
          { name: 'TUG', resultOptions: ['<10s Normal', '10-20s Functional', '>20s Impaired'] },
          { name: 'Functional Reach', resultOptions: ['Normal', 'Impaired'] },
          { name: '10-Meter Walk Test', resultOptions: ['Normal', 'Impaired'] },
          { name: '6-Minute Walk Test', resultOptions: ['Normal', 'Impaired'] },
          { name: 'Romberg', resultOptions: ['Positive', 'Negative'] },
          { name: 'Sharpened Romberg', resultOptions: ['Positive', 'Negative'] }
        ]
      },
      {
        group: 'Stroke',
        tests: [
          { name: 'Brunnstrom staging', resultOptions: ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4', 'Stage 5', 'Stage 6'] },
          { name: 'Fugl-Meyer Assessment', resultOptions: ['Severe', 'Moderate', 'Mild'] }
        ]
      },
      {
        group: 'SCI',
        tests: [
          { name: 'ISNCSCI/ASIA examination', resultOptions: ['AIS A', 'AIS B', 'AIS C', 'AIS D', 'AIS E'] }
        ]
      },
      {
        group: 'Parkinsonism',
        tests: [
          { name: 'Hoehn & Yahr', resultOptions: ['Stage 1', 'Stage 1.5', 'Stage 2', 'Stage 2.5', 'Stage 3', 'Stage 4', 'Stage 5'] },
          { name: 'MDS-UPDRS', resultOptions: ['Administered', 'Not administered'] }
        ]
      }
    ],
    outcomeMeasures: [
      { name: 'Berg Balance Scale', maxScore: 56 },
      { name: 'TUG', unit: 'seconds' },
      { name: 'Fugl-Meyer (Upper)', maxScore: 66 },
      { name: 'Fugl-Meyer (Lower)', maxScore: 34 },
      { name: 'Barthel Index', maxScore: 100 },
      { name: '6-Minute Walk Test', unit: 'meters' },
      { name: '10-Meter Walk Test', unit: 'seconds' }
    ]
  },
  {
    name: 'Cardiopulmonary',
    icon: '❤️',
    sections: [
      {
        title: 'History',
        subsections: [
          {
            title: 'History',
            fields: [
              { label: 'Dyspnoea', type: 'checkbox' },
              { label: 'Cough', type: 'checkbox' },
              { label: 'Sputum', type: 'textarea' },
              { label: 'Chest pain', type: 'checkbox' },
              { label: 'Exercise tolerance', type: 'textarea' },
              { label: 'Smoking/exposure history', type: 'textarea' },
              { label: 'Cardiac history', type: 'textarea' },
              { label: 'Medication', type: 'textarea' }
            ]
          }
        ]
      },
      {
        title: 'Examination',
        subsections: [
          {
            title: 'Vitals',
            fields: [
              { label: 'HR', type: 'number' },
              { label: 'BP', type: 'text' },
              { label: 'RR', type: 'number' },
              { label: 'SpO₂', type: 'number' },
              { label: 'Temperature', type: 'number' }
            ]
          },
          {
            title: 'Observation',
            fields: [
              { label: 'Breathing pattern', type: 'textarea' },
              { label: 'Accessory muscles', type: 'checkbox' },
              { label: 'Cyanosis', type: 'checkbox' },
              { label: 'Clubbing', type: 'checkbox' },
              { label: 'Chest deformity', type: 'checkbox' }
            ]
          },
          {
            title: 'Palpation',
            fields: [
              { label: 'Chest expansion', type: 'textarea' },
              { label: 'Tactile fremitus', type: 'textarea' }
            ]
          },
          {
            title: 'Percussion',
            fields: [
              { label: 'Resonance', type: 'textarea' }
            ]
          },
          {
            title: 'Auscultation',
            fields: [
              { label: 'Breath sounds', type: 'textarea' },
              { label: 'Added sounds', type: 'textarea' }
            ]
          },
          {
            title: 'Exercise Assessment',
            fields: [
              { label: 'Functional capacity', type: 'textarea' },
              { label: 'Exercise response', type: 'textarea' }
            ]
          }
        ]
      }
    ],
    specialTests: [
      {
        group: 'Functional Tests',
        tests: [
          { name: '6MWT', resultOptions: ['Normal', 'Below normal'] },
          { name: '2MWT', resultOptions: ['Normal', 'Below normal'] },
          { name: 'Incremental Shuttle Walk Test', resultOptions: ['Completed', 'Stopped early'] },
          { name: 'Sit-to-Stand tests', resultOptions: ['Normal', 'Impaired'] },
          { name: 'Borg exertion/dyspnoea rating', resultOptions: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] }
        ]
      },
      {
        group: 'Respiratory Measures',
        tests: [
          { name: 'Peak flow', resultOptions: ['Normal', 'Reduced'] },
          { name: 'Spirometry results interpretation', resultOptions: ['Normal', 'Obstructive', 'Restrictive', 'Mixed'] },
          { name: 'MIP/MEP', resultOptions: ['Normal', 'Reduced'] }
        ]
      }
    ],
    outcomeMeasures: [
      { name: '6MWT distance', unit: 'meters' },
      { name: '2MWT distance', unit: 'meters' },
      { name: 'Borg RPE', maxScore: 10 },
      { name: 'Borg Dyspnoea', maxScore: 10 },
      { name: 'Peak flow', unit: 'L/min' },
      { name: 'FEV1', unit: '%predicted' },
      { name: 'FVC', unit: '%predicted' }
    ]
  },
  {
    name: 'Paediatric',
    icon: '👶',
    sections: [
      {
        title: 'History',
        subsections: [
          {
            title: 'History',
            fields: [
              { label: 'Antenatal history', type: 'textarea' },
              { label: 'Birth history', type: 'textarea' },
              { label: 'NICU history', type: 'textarea' },
              { label: 'Developmental history', type: 'textarea' },
              { label: 'Milestones', type: 'textarea' },
              { label: 'Family history', type: 'textarea' }
            ]
          }
        ]
      },
      {
        title: 'Examination',
        subsections: [
          {
            title: 'Observation',
            fields: [
              { label: 'Posture', type: 'textarea' },
              { label: 'Head control', type: 'dropdown', options: ['Good', 'Fair', 'Poor', 'Absent'] },
              { label: 'Movement patterns', type: 'textarea' }
            ]
          },
          {
            title: 'Developmental Assessment',
            fields: [
              { label: 'Gross motor milestones', type: 'textarea' },
              { label: 'Fine motor screening', type: 'textarea' },
              { label: 'Functional mobility', type: 'textarea' }
            ]
          },
          {
            title: 'Neurological',
            fields: [
              { label: 'Tone', type: 'textarea' },
              { label: 'Reflexes', type: 'textarea' },
              { label: 'Primitive reflexes', type: 'textarea' },
              { label: 'Postural reactions', type: 'textarea' }
            ]
          },
          {
            title: 'Musculoskeletal',
            fields: [
              { label: 'ROM', type: 'textarea' },
              { label: 'Deformities', type: 'textarea' },
              { label: 'Contractures', type: 'textarea' }
            ]
          }
        ]
      }
    ],
    specialTests: [
      {
        group: 'Developmental Scales',
        tests: [
          { name: 'GMFCS', resultOptions: ['Level I', 'Level II', 'Level III', 'Level IV', 'Level V'] },
          { name: 'GMFM', resultOptions: ['Assessed'] },
          { name: 'Modified Ashworth Scale', resultOptions: ['0', '1', '1+', '2', '3', '4'] },
          { name: 'HINE', resultOptions: ['Assessed'] },
          { name: 'AIMS', resultOptions: ['Assessed'] }
        ]
      },
      {
        group: 'Cerebral Palsy',
        tests: [
          { name: 'Spasticity assessment', resultOptions: ['Mild', 'Moderate', 'Severe'] },
          { name: 'Selective motor control', resultOptions: ['Good', 'Fair', 'Poor'] },
          { name: 'Functional classification', resultOptions: ['Level I', 'Level II', 'Level III', 'Level IV', 'Level V'] }
        ]
      }
    ],
    outcomeMeasures: [
      { name: 'GMFM-66', maxScore: 100, unit: '%' },
      { name: 'GMFM-88', maxScore: 100, unit: '%' },
      { name: 'GMFCS Level', maxScore: 5 },
      { name: 'HINE Score', maxScore: 78 }
    ]
  },
  {
    name: 'Geriatric',
    icon: '🧓',
    sections: [
      {
        title: 'History',
        subsections: [
          {
            title: 'History',
            fields: [
              { label: 'Falls', type: 'textarea' },
              { label: 'Medications', type: 'textarea' },
              { label: 'Mobility', type: 'textarea' },
              { label: 'ADLs', type: 'textarea' },
              { label: 'Previous fractures', type: 'textarea' },
              { label: 'Assistive devices', type: 'textarea' }
            ]
          }
        ]
      },
      {
        title: 'Examination',
        subsections: [
          {
            title: 'Physical Assessment',
            fields: [
              { label: 'Posture', type: 'textarea' },
              { label: 'ROM', type: 'textarea' },
              { label: 'Strength', type: 'textarea' },
              { label: 'Balance', type: 'textarea' },
              { label: 'Gait', type: 'textarea' },
              { label: 'Transfers', type: 'textarea' }
            ]
          },
          {
            title: 'Functional',
            fields: [
              { label: 'Bed mobility', type: 'dropdown', options: ['Independent', 'Supervision', 'Minimal assist', 'Moderate assist', 'Dependent'] },
              { label: 'Sit-to-stand', type: 'dropdown', options: ['Independent', 'Supervision', 'Minimal assist', 'Moderate assist', 'Dependent'] },
              { label: 'Walking', type: 'dropdown', options: ['Independent', 'Supervision', 'Minimal assist', 'Moderate assist', 'Dependent'] },
              { label: 'Stairs', type: 'dropdown', options: ['Independent', 'Supervision', 'Minimal assist', 'Moderate assist', 'Dependent'] }
            ]
          }
        ]
      }
    ],
    specialTests: [
      {
        group: 'Balance and Mobility',
        tests: [
          { name: 'TUG', resultOptions: ['<10s Normal', '10-20s Functional', '>20s Impaired'] },
          { name: 'Berg Balance Scale', resultOptions: ['0-20 High risk', '21-40 Medium risk', '41-56 Low risk'] },
          { name: '5 Times Sit-to-Stand', resultOptions: ['Normal', 'Impaired'] },
          { name: '30-Second Chair Stand', resultOptions: ['Normal', 'Below normal'] },
          { name: 'Functional Reach', resultOptions: ['Normal', 'Impaired'] },
          { name: '6MWT', resultOptions: ['Normal', 'Below normal'] }
        ]
      }
    ],
    outcomeMeasures: [
      { name: 'TUG', unit: 'seconds' },
      { name: 'Berg Balance Scale', maxScore: 56 },
      { name: '5 Times Sit-to-Stand', unit: 'seconds' },
      { name: '30-Second Chair Stand', unit: 'repetitions' },
      { name: 'Functional Reach', unit: 'cm' },
      { name: '6MWT', unit: 'meters' }
    ]
  },
  {
    name: 'Sports',
    icon: '🏃',
    sections: [
      {
        title: 'History',
        subsections: [
          {
            title: 'History',
            fields: [
              { label: 'Sport', type: 'text' },
              { label: 'Position', type: 'text' },
              { label: 'Training volume', type: 'textarea' },
              { label: 'Mechanism of injury', type: 'textarea' },
              { label: 'Previous injuries', type: 'textarea' },
              { label: 'Return-to-sport goal', type: 'textarea' }
            ]
          }
        ]
      },
      {
        title: 'Examination',
        subsections: [
          {
            title: 'Physical Assessment',
            fields: [
              { label: 'Observation', type: 'textarea' },
              { label: 'ROM', type: 'textarea' },
              { label: 'Strength', type: 'textarea' },
              { label: 'Flexibility', type: 'textarea' },
              { label: 'Movement quality', type: 'textarea' }
            ]
          },
          {
            title: 'Functional Assessment',
            fields: [
              { label: 'Squat', type: 'textarea' },
              { label: 'Single-leg squat', type: 'textarea' },
              { label: 'Landing', type: 'textarea' },
              { label: 'Cutting', type: 'textarea' },
              { label: 'Running mechanics', type: 'textarea' }
            ]
          }
        ]
      }
    ],
    specialTests: [
      {
        group: 'Knee',
        tests: [
          { name: 'Lachman' },
          { name: 'Pivot shift' },
          { name: 'McMurray' }
        ]
      },
      {
        group: 'Ankle',
        tests: [
          { name: 'Anterior drawer' },
          { name: 'Talar tilt' }
        ]
      },
      {
        group: 'Functional Tests',
        tests: [
          { name: 'Single-leg hop', resultOptions: ['Symmetrical', 'Asymmetrical'] },
          { name: 'Triple hop', resultOptions: ['Symmetrical', 'Asymmetrical'] },
          { name: 'Crossover hop', resultOptions: ['Symmetrical', 'Asymmetrical'] },
          { name: 'Vertical jump', resultOptions: ['Normal', 'Reduced'] },
          { name: 'Y-Balance Test', resultOptions: ['Symmetrical', 'Asymmetrical'] },
          { name: 'Agility tests', resultOptions: ['Normal', 'Impaired'] }
        ]
      }
    ],
    outcomeMeasures: [
      { name: 'Limb Symmetry Index', maxScore: 100, unit: '%' },
      { name: 'Single-leg hop distance', unit: 'cm' },
      { name: 'Y-Balance composite', unit: '%' },
      { name: 'Vertical jump height', unit: 'cm' }
    ]
  },
  {
    name: "Women's Health",
    icon: '🤰',
    sections: [
      {
        title: 'History',
        subsections: [
          {
            title: 'History',
            fields: [
              { label: 'Obstetric history', type: 'textarea' },
              { label: 'Pregnancy history', type: 'textarea' },
              { label: 'Delivery type', type: 'dropdown', options: ['Normal vaginal', 'Assisted vaginal', 'Caesarean'] },
              { label: 'Pelvic pain', type: 'checkbox' },
              { label: 'Urinary symptoms', type: 'textarea' },
              { label: 'Bowel symptoms', type: 'textarea' },
              { label: 'Sexual symptoms (with consent)', type: 'textarea' },
              { label: 'Menstrual history', type: 'textarea' }
            ]
          }
        ]
      },
      {
        title: 'Examination',
        subsections: [
          {
            title: 'Posture and Alignment',
            fields: [
              { label: 'Posture', type: 'textarea' },
              { label: 'Lumbar spine', type: 'textarea' },
              { label: 'Pelvic alignment', type: 'textarea' }
            ]
          },
          {
            title: 'Musculoskeletal',
            fields: [
              { label: 'ROM', type: 'textarea' },
              { label: 'Strength', type: 'textarea' },
              { label: 'Abdominal muscle function', type: 'textarea' },
              { label: 'Breathing', type: 'textarea' }
            ]
          },
          {
            title: 'Pelvic Floor (with informed consent)',
            fields: [
              { label: 'Ability to contract', type: 'dropdown', options: ['Yes', 'No', 'Partial'] },
              { label: 'Relaxation', type: 'dropdown', options: ['Complete', 'Incomplete'] },
              { label: 'Endurance', type: 'textarea' },
              { label: 'Coordination', type: 'textarea' }
            ]
          }
        ]
      }
    ],
    specialTests: [
      {
        group: 'Pelvic Assessments',
        tests: [
          { name: 'Diastasis recti measurement', resultOptions: ['Normal', 'Present'] },
          { name: 'Pelvic girdle pain provocation tests', resultOptions: ['Positive', 'Negative'] },
          { name: 'Active Straight Leg Raise', resultOptions: ['Positive', 'Negative'] }
        ]
      }
    ],
    outcomeMeasures: [
      { name: 'PFDI-20', maxScore: 300 },
      { name: 'Pelvic Floor Impact Questionnaire', maxScore: 300 },
      { name: 'ICIQ-SF', maxScore: 21 },
      { name: 'Diastasis recti width', unit: 'finger widths' }
    ]
  },
  {
    name: 'Hand Rehabilitation',
    icon: '✋',
    sections: [
      {
        title: 'History',
        subsections: [
          {
            title: 'History',
            fields: [
              { label: 'Hand dominance', type: 'dropdown', options: ['Right', 'Left', 'Ambidextrous'] },
              { label: 'Occupation', type: 'text' },
              { label: 'Mechanism of injury', type: 'textarea' },
              { label: 'Surgery', type: 'textarea' },
              { label: 'Functional limitations', type: 'textarea' }
            ]
          }
        ]
      },
      {
        title: 'Examination',
        subsections: [
          {
            title: 'Observation',
            fields: [
              { label: 'Swelling', type: 'checkbox' },
              { label: 'Scar', type: 'checkbox' },
              { label: 'Deformity', type: 'checkbox' },
              { label: 'Atrophy', type: 'checkbox' }
            ]
          },
          {
            title: 'ROM',
            fields: [
              { label: 'Wrist', type: 'textarea' },
              { label: 'MCP', type: 'textarea' },
              { label: 'PIP', type: 'textarea' },
              { label: 'DIP', type: 'textarea' }
            ]
          },
          {
            title: 'Strength',
            fields: [
              { label: 'Grip strength', type: 'text' },
              { label: 'Pinch strength', type: 'text' }
            ]
          },
          {
            title: 'Sensory',
            fields: [
              { label: 'Light touch', type: 'dropdown', options: ['Normal', 'Impaired', 'Absent'] },
              { label: 'Two-point discrimination', type: 'text' },
              { label: 'Semmes-Weinstein monofilaments', type: 'textarea' }
            ]
          }
        ]
      }
    ],
    specialTests: [
      {
        group: 'Carpal Tunnel',
        tests: [
          { name: 'Phalen' },
          { name: 'Tinel' },
          { name: 'Durkan compression' }
        ]
      },
      {
        group: 'De Quervain',
        tests: [
          { name: 'Finkelstein' }
        ]
      },
      {
        group: 'Thumb',
        tests: [
          { name: 'CMC grind test' }
        ]
      },
      {
        group: 'Tendon',
        tests: [
          { name: 'Tendon gliding assessment', resultOptions: ['Normal', 'Impaired'] }
        ]
      }
    ],
    outcomeMeasures: [
      { name: 'Grip strength', unit: 'kg' },
      { name: 'Pinch strength', unit: 'kg' },
      { name: 'DASH', maxScore: 100 },
      { name: 'QuickDASH', maxScore: 100 }
    ]
  },
  {
    name: 'Burns Rehabilitation',
    icon: '🔥',
    sections: [
      {
        title: 'History',
        subsections: [
          {
            title: 'History',
            fields: [
              { label: 'Cause of burn', type: 'textarea' },
              { label: 'Date', type: 'text' },
              { label: 'Depth', type: 'dropdown', options: ['Superficial', 'Superficial partial', 'Deep partial', 'Full thickness'] },
              { label: 'Percentage TBSA', type: 'number' },
              { label: 'Surgery/grafting', type: 'textarea' },
              { label: 'Healing stage', type: 'textarea' }
            ]
          }
        ]
      },
      {
        title: 'Examination',
        subsections: [
          {
            title: 'Skin',
            fields: [
              { label: 'Scar', type: 'textarea' },
              { label: 'Pigmentation', type: 'textarea' },
              { label: 'Adhesions', type: 'checkbox' },
              { label: 'Hypertrophic scar', type: 'checkbox' }
            ]
          },
          {
            title: 'ROM',
            fields: [
              { label: 'Joint ROM', type: 'textarea' },
              { label: 'Contractures', type: 'textarea' }
            ]
          },
          {
            title: 'Strength',
            fields: [
              { label: 'MMT', type: 'textarea' },
              { label: 'Functional strength', type: 'textarea' }
            ]
          },
          {
            title: 'Function',
            fields: [
              { label: 'ADL', type: 'textarea' },
              { label: 'Mobility', type: 'textarea' },
              { label: 'Hand function', type: 'textarea' }
            ]
          },
          {
            title: 'Pain',
            fields: [
              { label: 'Resting pain', type: 'number' },
              { label: 'Movement pain', type: 'number' }
            ]
          }
        ]
      }
    ],
    specialTests: [
      {
        group: 'Scar Assessment',
        tests: [
          { name: 'Vancouver Scar Scale', resultOptions: ['Assessed'] },
          { name: 'POSAS', resultOptions: ['Assessed'] }
        ]
      },
      {
        group: 'Other',
        tests: [
          { name: 'ROM measurement', resultOptions: ['Normal', 'Restricted'] },
          { name: 'Contracture assessment', resultOptions: ['Present', 'Absent'] },
          { name: 'Functional capacity', resultOptions: ['Independent', 'Assisted', 'Dependent'] }
        ]
      }
    ],
    outcomeMeasures: [
      { name: 'Vancouver Scar Scale', maxScore: 13 },
      { name: 'POSAS Observer', maxScore: 60 },
      { name: 'POSAS Patient', maxScore: 60 },
      { name: 'Percentage TBSA healed', maxScore: 100, unit: '%' }
    ]
  },
  {
    name: 'Amputee Rehabilitation',
    icon: '🦿',
    sections: [
      {
        title: 'History',
        subsections: [
          {
            title: 'History',
            fields: [
              { label: 'Cause of amputation', type: 'textarea' },
              { label: 'Level', type: 'dropdown', options: ['Transtibial', 'Transfemoral', 'Through knee', 'Partial foot', 'Upper limb'] },
              { label: 'Date', type: 'text' },
              { label: 'Surgery', type: 'textarea' },
              { label: 'Comorbidities', type: 'textarea' },
              { label: 'Previous prosthesis', type: 'textarea' }
            ]
          }
        ]
      },
      {
        title: 'Examination',
        subsections: [
          {
            title: 'Residual Limb',
            fields: [
              { label: 'Shape', type: 'dropdown', options: ['Conical', 'Cylindrical', 'Bulbous', 'Other'] },
              { label: 'Length', type: 'text' },
              { label: 'Skin', type: 'textarea' },
              { label: 'Scar', type: 'textarea' },
              { label: 'Swelling', type: 'dropdown', options: ['None', 'Mild', 'Moderate', 'Severe'] },
              { label: 'Tenderness', type: 'checkbox' }
            ]
          },
          {
            title: 'ROM',
            fields: [
              { label: 'Hip flexion contracture', type: 'text' },
              { label: 'Hip abduction contracture', type: 'text' },
              { label: 'Knee flexion contracture', type: 'text' }
            ]
          },
          {
            title: 'Strength',
            fields: [
              { label: 'Trunk', type: 'textarea' },
              { label: 'Hip muscles', type: 'textarea' },
              { label: 'Remaining limb', type: 'textarea' }
            ]
          },
          {
            title: 'Balance',
            fields: [
              { label: 'Sitting', type: 'dropdown', options: ['Independent', 'With support', 'Unable'] },
              { label: 'Standing', type: 'dropdown', options: ['Independent', 'With support', 'Unable'] }
            ]
          },
          {
            title: 'Functional Assessment',
            fields: [
              { label: 'Transfers', type: 'dropdown', options: ['Independent', 'Supervision', 'Minimal assist', 'Moderate assist', 'Dependent'] },
              { label: 'Wheelchair', type: 'dropdown', options: ['Independent', 'Supervision', 'Dependent'] },
              { label: 'Walking', type: 'textarea' }
            ]
          }
        ]
      }
    ],
    specialTests: [
      {
        group: 'Amputee Assessments',
        tests: [
          { name: 'Amputee Mobility Predictor', resultOptions: ['Assessed'] },
          { name: 'TUG', resultOptions: ['<10s Normal', '10-20s Functional', '>20s Impaired'] },
          { name: '6MWT', resultOptions: ['Normal', 'Below normal'] },
          { name: '10MWT', resultOptions: ['Normal', 'Impaired'] },
          { name: 'Prosthetic fit and alignment observation', resultOptions: ['Good', 'Fair', 'Poor'] }
        ]
      }
    ],
    outcomeMeasures: [
      { name: 'Amputee Mobility Predictor', maxScore: 47 },
      { name: 'TUG', unit: 'seconds' },
      { name: '6MWT', unit: 'meters' },
      { name: '10MWT', unit: 'seconds' },
      { name: 'K-Level', maxScore: 4 }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    await Specialty.deleteMany({});
    console.log('Cleared existing specialties');

    await Specialty.insertMany(specialties);
    console.log(`Seeded ${specialties.length} specialties`);

    await mongoose.connection.close();
    console.log('Done');
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
