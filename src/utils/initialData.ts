import { Student, Video } from '@/types';

export const initialVideos: Video[] = [
  // 1.1 Python for DataScience
  { id: '1.1-1', folder: '1.1 Python for DataScience', title: 'Introduction of Python.mp4' },
  { id: '1.1-2', folder: '1.1 Python for DataScience', title: 'DataTypes.mp4' },
  { id: '1.1-3', folder: '1.1 Python for DataScience', title: 'Variables.mp4' },
  { id: '1.1-4', folder: '1.1 Python for DataScience', title: 'Operators.mp4' },
  { id: '1.1-5', folder: '1.1 Python for DataScience', title: 'Conditional Statements.mp4' },
  { id: '1.1-6', folder: '1.1 Python for DataScience', title: 'Loops.mp4' },
  { id: '1.1-7', folder: '1.1 Python for DataScience', title: 'Functions.mp4' },
  { id: '1.1-8', folder: '1.1 Python for DataScience', title: 'Lists and Tuples.mp4' },
  { id: '1.1-9', folder: '1.1 Python for DataScience', title: 'Dictionaries and Sets.mp4' },
  { id: '1.1-10', folder: '1.1 Python for DataScience', title: 'File Handling.mp4' },

  // 1.2 Numpy
  { id: '1.2-1', folder: '1.2 Numpy', title: 'Introduction to Numpy.mp4' },
  { id: '1.2-2', folder: '1.2 Numpy', title: 'Arrays.mp4' },
  { id: '1.2-3', folder: '1.2 Numpy', title: 'Array Indexing.mp4' },
  { id: '1.2-4', folder: '1.2 Numpy', title: 'Array Slicing.mp4' },
  { id: '1.2-5', folder: '1.2 Numpy', title: 'Array Operations.mp4' },
  { id: '1.2-6', folder: '1.2 Numpy', title: 'Statistical Functions.mp4' },
  { id: '1.2-7', folder: '1.2 Numpy', title: 'Linear Algebra.mp4' },

  // 1.3 Pandas
  { id: '1.3-1', folder: '1.3 Pandas', title: 'Introduction to Pandas.mp4' },
  { id: '1.3-2', folder: '1.3 Pandas', title: 'Series and DataFrames.mp4' },
  { id: '1.3-3', folder: '1.3 Pandas', title: 'Data Selection.mp4' },
  { id: '1.3-4', folder: '1.3 Pandas', title: 'Data Cleaning.mp4' },
  { id: '1.3-5', folder: '1.3 Pandas', title: 'Data Transformation.mp4' },
  { id: '1.3-6', folder: '1.3 Pandas', title: 'Grouping and Aggregation.mp4' },
  { id: '1.3-7', folder: '1.3 Pandas', title: 'Merging and Joining.mp4' },
  { id: '1.3-8', folder: '1.3 Pandas', title: 'Time Series.mp4' },

  // 1.4 Matplotlib and Seaborn
  { id: '1.4-1', folder: '1.4 Matplotlib and Seaborn', title: 'Introduction to Matplotlib.mp4' },
  { id: '1.4-2', folder: '1.4 Matplotlib and Seaborn', title: 'Line Plots.mp4' },
  { id: '1.4-3', folder: '1.4 Matplotlib and Seaborn', title: 'Bar Charts.mp4' },
  { id: '1.4-4', folder: '1.4 Matplotlib and Seaborn', title: 'Scatter Plots.mp4' },
  { id: '1.4-5', folder: '1.4 Matplotlib and Seaborn', title: 'Histograms.mp4' },
  { id: '1.4-6', folder: '1.4 Matplotlib and Seaborn', title: 'Introduction to Seaborn.mp4' },
  { id: '1.4-7', folder: '1.4 Matplotlib and Seaborn', title: 'Statistical Plots.mp4' },
  { id: '1.4-8', folder: '1.4 Matplotlib and Seaborn', title: 'Customization.mp4' },

  // 2.1 Statistics Fundamentals
  { id: '2.1-1', folder: '2.1 Statistics Fundamentals', title: 'Descriptive Statistics.mp4' },
  { id: '2.1-2', folder: '2.1 Statistics Fundamentals', title: 'Measures of Central Tendency.mp4' },
  { id: '2.1-3', folder: '2.1 Statistics Fundamentals', title: 'Measures of Dispersion.mp4' },
  { id: '2.1-4', folder: '2.1 Statistics Fundamentals', title: 'Probability Basics.mp4' },
  { id: '2.1-5', folder: '2.1 Statistics Fundamentals', title: 'Distributions.mp4' },
  { id: '2.1-6', folder: '2.1 Statistics Fundamentals', title: 'Hypothesis Testing.mp4' },
  { id: '2.1-7', folder: '2.1 Statistics Fundamentals', title: 'Correlation.mp4' },

  // 2.2 Machine Learning Basics
  { id: '2.2-1', folder: '2.2 Machine Learning Basics', title: 'Introduction to ML.mp4' },
  { id: '2.2-2', folder: '2.2 Machine Learning Basics', title: 'Supervised Learning.mp4' },
  { id: '2.2-3', folder: '2.2 Machine Learning Basics', title: 'Unsupervised Learning.mp4' },
  { id: '2.2-4', folder: '2.2 Machine Learning Basics', title: 'Linear Regression.mp4' },
  { id: '2.2-5', folder: '2.2 Machine Learning Basics', title: 'Logistic Regression.mp4' },
  { id: '2.2-6', folder: '2.2 Machine Learning Basics', title: 'Decision Trees.mp4' },
  { id: '2.2-7', folder: '2.2 Machine Learning Basics', title: 'Random Forests.mp4' },
  { id: '2.2-8', folder: '2.2 Machine Learning Basics', title: 'Model Evaluation.mp4' },

  // 3.1 Deep Learning
  { id: '3.1-1', folder: '3.1 Deep Learning', title: 'Neural Networks Basics.mp4' },
  { id: '3.1-2', folder: '3.1 Deep Learning', title: 'Activation Functions.mp4' },
  { id: '3.1-3', folder: '3.1 Deep Learning', title: 'Backpropagation.mp4' },
  { id: '3.1-4', folder: '3.1 Deep Learning', title: 'CNN Introduction.mp4' },
  { id: '3.1-5', folder: '3.1 Deep Learning', title: 'RNN and LSTM.mp4' },
  { id: '3.1-6', folder: '3.1 Deep Learning', title: 'Transfer Learning.mp4' },

  // 3.2 Projects
  { id: '3.2-1', folder: '3.2 Projects', title: 'Data Analysis Project.mp4' },
  { id: '3.2-2', folder: '3.2 Projects', title: 'Prediction Model Project.mp4' },
  { id: '3.2-3', folder: '3.2 Projects', title: 'Image Classification Project.mp4' },
  { id: '3.2-4', folder: '3.2 Projects', title: 'NLP Project.mp4' },
  { id: '3.2-5', folder: '3.2 Projects', title: 'Final Capstone Project.mp4' },
];

// Simple hash function for password (in production, use proper bcrypt)
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `hash_${hash}`;
};

export const initialStudents: Student[] = [
  {
    name: 'Admin User',
    username: 'admin',
    password: simpleHash('Admin123'),
    role: 'admin',
    completedVideos: [],
    lastUpdated: new Date().toISOString(),
  },
  {
    name: 'Sabari Yuhendhran',
    username: 'sabari',
    password: simpleHash('Sabari123'),
    role: 'student',
    completedVideos: ['1.1-1', '1.1-2', '1.2-1'],
    lastUpdated: new Date().toISOString(),
  },
];

export const hashPassword = simpleHash;
