export interface Chapter {
  id: string;
  name: string;
}

export interface Topic {
  id: string;
  name: string;
  standard: 4 | 7;
  olympiad: 'IMO' | 'ISO';
  icon: string;
  color: string;
  chapters: Chapter[];
  description: string;
}

export const topics: Topic[] = [
  // IMO Standard 4 (10 Topics)
  { id: 'imo4-1', name: 'Number Sense & Numerals', standard: 4, olympiad: 'IMO', icon: '🔢', color: '#667eea', description: 'Place value, comparison, large numbers', chapters: [
    { id: 'c1', name: 'Numbers up to 10,000' }, { id: 'c2', name: 'Place Value & Face Value' }, { id: 'c3', name: 'Comparing Numbers' }, { id: 'c4', name: 'Rounding Off Numbers' }, { id: 'c5', name: 'Roman Numerals' }
  ]},
  { id: 'imo4-2', name: 'Computational Operations', standard: 4, olympiad: 'IMO', icon: '➕', color: '#764ba2', description: 'Addition, subtraction, multiplication, division', chapters: [
    { id: 'c1', name: 'Addition & Subtraction' }, { id: 'c2', name: 'Multiplication' }, { id: 'c3', name: 'Division' }, { id: 'c4', name: 'Word Problems' }, { id: 'c5', name: 'BODMAS Rule' }
  ]},
  { id: 'imo4-3', name: 'Factors & Multiples', standard: 4, olympiad: 'IMO', icon: '✖️', color: '#f093fb', description: 'Factors, multiples, HCF, LCM', chapters: [
    { id: 'c1', name: 'Factors of a Number' }, { id: 'c2', name: 'Multiples of a Number' }, { id: 'c3', name: 'Prime Numbers' }, { id: 'c4', name: 'HCF & LCM' }, { id: 'c5', name: 'Divisibility Rules' }
  ]},
  { id: 'imo4-4', name: 'Fractions & Decimals', standard: 4, olympiad: 'IMO', icon: '🥧', color: '#f5576c', description: 'Types of fractions, operations, decimals', chapters: [
    { id: 'c1', name: 'Types of Fractions' }, { id: 'c2', name: 'Equivalent Fractions' }, { id: 'c3', name: 'Addition & Subtraction of Fractions' }, { id: 'c4', name: 'Introduction to Decimals' }, { id: 'c5', name: 'Fraction-Decimal Conversion' }
  ]},
  { id: 'imo4-5', name: 'Measurement', standard: 4, olympiad: 'IMO', icon: '📏', color: '#10b981', description: 'Length, weight, capacity, time, money', chapters: [
    { id: 'c1', name: 'Length & Distance' }, { id: 'c2', name: 'Weight & Mass' }, { id: 'c3', name: 'Capacity' }, { id: 'c4', name: 'Time & Calendar' }, { id: 'c5', name: 'Money' }
  ]},
  { id: 'imo4-6', name: 'Geometry', standard: 4, olympiad: 'IMO', icon: '📐', color: '#06b6d4', description: 'Lines, angles, triangles, circles', chapters: [
    { id: 'c1', name: 'Points, Lines & Rays' }, { id: 'c2', name: 'Types of Angles' }, { id: 'c3', name: 'Triangles' }, { id: 'c4', name: 'Circles' }, { id: 'c5', name: '3D Shapes Introduction' }
  ]},
  { id: 'imo4-7', name: 'Data Handling', standard: 4, olympiad: 'IMO', icon: '📊', color: '#8b5cf6', description: 'Pictographs, bar graphs, tables', chapters: [
    { id: 'c1', name: 'Pictographs' }, { id: 'c2', name: 'Bar Graphs' }, { id: 'c3', name: 'Tables & Tally Marks' }, { id: 'c4', name: 'Reading Data' }, { id: 'c5', name: 'Interpreting Graphs' }
  ]},
  { id: 'imo4-8', name: 'Patterns & Puzzles', standard: 4, olympiad: 'IMO', icon: '🧩', color: '#ec4899', description: 'Number patterns, figure patterns, puzzles', chapters: [
    { id: 'c1', name: 'Number Patterns' }, { id: 'c2', name: 'Figure Patterns' }, { id: 'c3', name: 'Sequence Completion' }, { id: 'c4', name: 'Magic Squares' }, { id: 'c5', name: 'Coding-Decoding' }
  ]},
  { id: 'imo4-9', name: 'Logical Reasoning', standard: 4, olympiad: 'IMO', icon: '🧠', color: '#f59e0b', description: 'Sequences, analogies, classifications', chapters: [
    { id: 'c1', name: 'Series Completion' }, { id: 'c2', name: 'Analogy' }, { id: 'c3', name: 'Classification' }, { id: 'c4', name: 'Direction Sense' }, { id: 'c5', name: 'Blood Relations' }
  ]},
  { id: 'imo4-10', name: 'Symmetry & Rotation', standard: 4, olympiad: 'IMO', icon: '🔄', color: '#14b8a6', description: 'Line symmetry, rotational symmetry', chapters: [
    { id: 'c1', name: 'Line Symmetry' }, { id: 'c2', name: 'Rotational Symmetry' }, { id: 'c3', name: 'Mirror Images' }, { id: 'c4', name: 'Patterns & Designs' }, { id: 'c5', name: 'Symmetry in Nature' }
  ]},

  // IMO Standard 7 (12 Topics)
  { id: 'imo7-1', name: 'Integers', standard: 7, olympiad: 'IMO', icon: '±', color: '#667eea', description: 'Properties, operations on integers', chapters: [
    { id: 'c1', name: 'Introduction to Integers' }, { id: 'c2', name: 'Addition of Integers' }, { id: 'c3', name: 'Subtraction of Integers' }, { id: 'c4', name: 'Multiplication of Integers' }, { id: 'c5', name: 'Division of Integers' }, { id: 'c6', name: 'Properties of Integers' }
  ]},
  { id: 'imo7-2', name: 'Fractions & Decimals', standard: 7, olympiad: 'IMO', icon: '🥧', color: '#764ba2', description: 'Operations, conversion, word problems', chapters: [
    { id: 'c1', name: 'Multiplication of Fractions' }, { id: 'c2', name: 'Division of Fractions' }, { id: 'c3', name: 'Multiplication of Decimals' }, { id: 'c4', name: 'Division of Decimals' }, { id: 'c5', name: 'Conversion of Fractions & Decimals' }
  ]},
  { id: 'imo7-3', name: 'Data Handling', standard: 7, olympiad: 'IMO', icon: '📊', color: '#f093fb', description: 'Mean, median, mode, probability', chapters: [
    { id: 'c1', name: 'Mean' }, { id: 'c2', name: 'Median' }, { id: 'c3', name: 'Mode' }, { id: 'c4', name: 'Bar Graphs (Double)' }, { id: 'c5', name: 'Probability Basics' }
  ]},
  { id: 'imo7-4', name: 'Simple Equations', standard: 7, olympiad: 'IMO', icon: '⚖️', color: '#f5576c', description: 'Solving equations, applications', chapters: [
    { id: 'c1', name: 'Variables & Expressions' }, { id: 'c2', name: 'Solving Linear Equations' }, { id: 'c3', name: 'Transposing Method' }, { id: 'c4', name: 'Word Problems to Equations' }, { id: 'c5', name: 'Applications of Equations' }
  ]},
  { id: 'imo7-5', name: 'Lines & Angles', standard: 7, olympiad: 'IMO', icon: '📐', color: '#10b981', description: 'Types, pairs, properties', chapters: [
    { id: 'c1', name: 'Complementary Angles' }, { id: 'c2', name: 'Supplementary Angles' }, { id: 'c3', name: 'Adjacent Angles' }, { id: 'c4', name: 'Linear Pair' }, { id: 'c5', name: 'Vertically Opposite Angles' }, { id: 'c6', name: 'Parallel Lines & Transversal' }
  ]},
  { id: 'imo7-6', name: 'Triangles & Properties', standard: 7, olympiad: 'IMO', icon: '🔺', color: '#06b6d4', description: 'Pythagoras, congruence, properties', chapters: [
    { id: 'c1', name: 'Properties of Triangles' }, { id: 'c2', name: 'Pythagoras Theorem' }, { id: 'c3', name: 'Congruence of Triangles' }, { id: 'c4', name: 'Criteria for Congruence' }, { id: 'c5', name: 'Exterior Angle Property' }
  ]},
  { id: 'imo7-7', name: 'Comparing Quantities', standard: 7, olympiad: 'IMO', icon: '💰', color: '#8b5cf6', description: 'Ratio, percentage, profit/loss, SI', chapters: [
    { id: 'c1', name: 'Ratio & Proportion' }, { id: 'c2', name: 'Percentage' }, { id: 'c3', name: 'Profit & Loss' }, { id: 'c4', name: 'Simple Interest' }, { id: 'c5', name: 'Applications of Percentage' }
  ]},
  { id: 'imo7-8', name: 'Perimeter & Area', standard: 7, olympiad: 'IMO', icon: '⬜', color: '#ec4899', description: 'Shapes, circles, conversion', chapters: [
    { id: 'c1', name: 'Perimeter of Shapes' }, { id: 'c2', name: 'Area of Rectangle & Square' }, { id: 'c3', name: 'Area of Triangle' }, { id: 'c4', name: 'Area of Circle' }, { id: 'c5', name: 'Conversion of Units' }
  ]},
  { id: 'imo7-9', name: 'Algebraic Expressions', standard: 7, olympiad: 'IMO', icon: '🔤', color: '#f59e0b', description: 'Operations, identities', chapters: [
    { id: 'c1', name: 'Terms & Factors' }, { id: 'c2', name: 'Addition & Subtraction' }, { id: 'c3', name: 'Multiplication' }, { id: 'c4', name: 'Standard Identities' }, { id: 'c5', name: 'Using Identities' }
  ]},
  { id: 'imo7-10', name: 'Exponents & Powers', standard: 7, olympiad: 'IMO', icon: '⬆️', color: '#14b8a6', description: 'Laws of exponents, standard form', chapters: [
    { id: 'c1', name: 'Introduction to Exponents' }, { id: 'c2', name: 'Laws of Exponents' }, { id: 'c3', name: 'Negative Exponents' }, { id: 'c4', name: 'Standard Form' }, { id: 'c5', name: 'Very Large & Small Numbers' }
  ]},
  { id: 'imo7-11', name: 'Symmetry & Rotation', standard: 7, olympiad: 'IMO', icon: '🔄', color: '#6366f1', description: 'Lines of symmetry, rotational', chapters: [
    { id: 'c1', name: 'Lines of Symmetry' }, { id: 'c2', name: 'Rotational Symmetry' }, { id: 'c3', name: 'Order of Rotation' }, { id: 'c4', name: 'Angle of Rotation' }, { id: 'c5', name: 'Symmetry in Regular Polygons' }
  ]},
  { id: 'imo7-12', name: 'Visualizing Solid Shapes', standard: 7, olympiad: 'IMO', icon: '🧊', color: '#a855f7', description: '3D shapes, nets, views', chapters: [
    { id: 'c1', name: '3D Shapes' }, { id: 'c2', name: 'Faces, Edges, Vertices' }, { id: 'c3', name: 'Nets of 3D Shapes' }, { id: 'c4', name: 'Views of Solids' }, { id: 'c5', name: 'Mapping Space Around Us' }
  ]},

  // ISO Standard 4 (10 Topics)
  { id: 'iso4-1', name: 'Plants', standard: 4, olympiad: 'ISO', icon: '🌱', color: '#10b981', description: 'Life, diversity, photosynthesis', chapters: [
    { id: 'c1', name: 'Parts of a Plant' }, { id: 'c2', name: 'Types of Plants' }, { id: 'c3', name: 'Photosynthesis' }, { id: 'c4', name: 'Plant Reproduction' }, { id: 'c5', name: 'Uses of Plants' }
  ]},
  { id: 'iso4-2', name: 'Animals', standard: 4, olympiad: 'ISO', icon: '🦁', color: '#f59e0b', description: 'Classification, habitats, adaptations', chapters: [
    { id: 'c1', name: 'Classification of Animals' }, { id: 'c2', name: 'Habitats' }, { id: 'c3', name: 'Adaptations' }, { id: 'c4', name: 'Animal Behavior' }, { id: 'c5', name: 'Endangered Animals' }
  ]},
  { id: 'iso4-3', name: 'Human Body & Health', standard: 4, olympiad: 'ISO', icon: '🫀', color: '#ef4444', description: 'Digestive, respiratory, circulatory', chapters: [
    { id: 'c1', name: 'Digestive System' }, { id: 'c2', name: 'Respiratory System' }, { id: 'c3', name: 'Circulatory System' }, { id: 'c4', name: 'Skeletal System' }, { id: 'c5', name: 'Healthy Habits' }
  ]},
  { id: 'iso4-4', name: 'Food & Nutrition', standard: 4, olympiad: 'ISO', icon: '🍎', color: '#10b981', description: 'Nutrients, balanced diet', chapters: [
    { id: 'c1', name: 'Components of Food' }, { id: 'c2', name: 'Nutrients & Their Functions' }, { id: 'c3', name: 'Balanced Diet' }, { id: 'c4', name: 'Deficiency Diseases' }, { id: 'c5', name: 'Food Preservation' }
  ]},
  { id: 'iso4-5', name: 'Matter & Materials', standard: 4, olympiad: 'ISO', icon: '🧪', color: '#8b5cf6', description: 'States, properties, changes', chapters: [
    { id: 'c1', name: 'States of Matter' }, { id: 'c2', name: 'Properties of Materials' }, { id: 'c3', name: 'Physical Changes' }, { id: 'c4', name: 'Chemical Changes' }, { id: 'c5', name: 'Mixtures & Separation' }
  ]},
  { id: 'iso4-6', name: 'Force, Work & Energy', standard: 4, olympiad: 'ISO', icon: '⚡', color: '#f59e0b', description: 'Simple machines, light, sound, heat', chapters: [
    { id: 'c1', name: 'Force & Motion' }, { id: 'c2', name: 'Simple Machines' }, { id: 'c3', name: 'Light' }, { id: 'c4', name: 'Sound' }, { id: 'c5', name: 'Heat & Temperature' }
  ]},
  { id: 'iso4-7', name: 'Earth & Universe', standard: 4, olympiad: 'ISO', icon: '🌍', color: '#06b6d4', description: 'Layers, rocks, water cycle, solar system', chapters: [
    { id: 'c1', name: 'Layers of Earth' }, { id: 'c2', name: 'Rocks & Minerals' }, { id: 'c3', name: 'Water Cycle' }, { id: 'c4', name: 'Solar System' }, { id: 'c5', name: 'Earth in Space' }
  ]},
  { id: 'iso4-8', name: 'Weather & Climate', standard: 4, olympiad: 'ISO', icon: '🌤️', color: '#6366f1', description: 'Elements, seasons, natural calamities', chapters: [
    { id: 'c1', name: 'Weather Elements' }, { id: 'c2', name: 'Seasons' }, { id: 'c3', name: 'Natural Calamities' }, { id: 'c4', name: 'Measuring Weather' }, { id: 'c5', name: 'Safety Measures' }
  ]},
  { id: 'iso4-9', name: 'Living Things & Environment', standard: 4, olympiad: 'ISO', icon: '🌿', color: '#14b8a6', description: 'Ecosystems, conservation, pollution', chapters: [
    { id: 'c1', name: 'Ecosystems' }, { id: 'c2', name: 'Food Chains' }, { id: 'c3', name: 'Conservation' }, { id: 'c4', name: 'Pollution' }, { id: 'c5', name: 'Waste Management' }
  ]},
  { id: 'iso4-10', name: 'Science in Daily Life', standard: 4, olympiad: 'ISO', icon: '🔬', color: '#a855f7', description: 'Technology, inventions, communication', chapters: [
    { id: 'c1', name: 'Simple Technology' }, { id: 'c2', name: 'Famous Inventions' }, { id: 'c3', name: 'Communication' }, { id: 'c4', name: 'Transport' }, { id: 'c5', name: 'Science at Home' }
  ]},

  // ISO Standard 7 (12 Topics)
  { id: 'iso7-1', name: 'Nutrition in Plants & Animals', standard: 7, olympiad: 'ISO', icon: '🌾', color: '#10b981', description: 'Autotrophic, heterotrophic, digestion', chapters: [
    { id: 'c1', name: 'Autotrophic Nutrition' }, { id: 'c2', name: 'Heterotrophic Nutrition' }, { id: 'c3', name: 'Photosynthesis Process' }, { id: 'c4', name: 'Human Digestive System' }, { id: 'c5', name: 'Nutrition in Animals' }
  ]},
  { id: 'iso7-2', name: 'Heat & Temperature', standard: 7, olympiad: 'ISO', icon: '🌡️', color: '#ef4444', description: 'Conduction, convection, radiation', chapters: [
    { id: 'c1', name: 'Temperature & Thermometers' }, { id: 'c2', name: 'Conduction' }, { id: 'c3', name: 'Convection' }, { id: 'c4', name: 'Radiation' }, { id: 'c5', name: 'Heat Transfer in Daily Life' }
  ]},
  { id: 'iso7-3', name: 'Acids, Bases & Salts', standard: 7, olympiad: 'ISO', icon: '⚗️', color: '#8b5cf6', description: 'Indicators, neutralization, pH', chapters: [
    { id: 'c1', name: 'Acids' }, { id: 'c2', name: 'Bases' }, { id: 'c3', name: 'Indicators' }, { id: 'c4', name: 'Neutralization' }, { id: 'c5', name: 'Salts & pH Scale' }
  ]},
  { id: 'iso7-4', name: 'Physical & Chemical Changes', standard: 7, olympiad: 'ISO', icon: '🔄', color: '#06b6d4', description: 'Rusting, crystallization', chapters: [
    { id: 'c1', name: 'Physical Changes' }, { id: 'c2', name: 'Chemical Changes' }, { id: 'c3', name: 'Rusting of Iron' }, { id: 'c4', name: 'Crystallization' }, { id: 'c5', name: 'Preventing Rust' }
  ]},
  { id: 'iso7-5', name: 'Winds, Storms & Cyclones', standard: 7, olympiad: 'ISO', icon: '🌪️', color: '#6366f1', description: 'Air pressure, safety', chapters: [
    { id: 'c1', name: 'Air & Air Pressure' }, { id: 'c2', name: 'Wind Formation' }, { id: 'c3', name: 'Storms' }, { id: 'c4', name: 'Cyclones' }, { id: 'c5', name: 'Safety Measures' }
  ]},
  { id: 'iso7-6', name: 'Light', standard: 7, olympiad: 'ISO', icon: '💡', color: '#f59e0b', description: 'Reflection, image formation, dispersion', chapters: [
    { id: 'c1', name: 'Rectilinear Propagation' }, { id: 'c2', name: 'Reflection of Light' }, { id: 'c3', name: 'Image Formation (Plane Mirror)' }, { id: 'c4', name: 'Spherical Mirrors' }, { id: 'c5', name: 'Dispersion of Light' }
  ]},
  { id: 'iso7-7', name: 'Electric Current & Circuits', standard: 7, olympiad: 'ISO', icon: '🔌', color: '#f5576c', description: 'Heating, magnetic effects, electromagnet', chapters: [
    { id: 'c1', name: 'Electric Circuit' }, { id: 'c2', name: 'Heating Effect of Current' }, { id: 'c3', name: 'Magnetic Effect of Current' }, { id: 'c4', name: 'Electromagnet' }, { id: 'c5', name: 'Electric Safety' }
  ]},
  { id: 'iso7-8', name: 'Weather, Climate & Adaptations', standard: 7, olympiad: 'ISO', icon: '🌡️', color: '#14b8a6', description: 'Polar, tropical adaptations', chapters: [
    { id: 'c1', name: 'Weather vs Climate' }, { id: 'c2', name: 'Polar Regions' }, { id: 'c3', name: 'Tropical Regions' }, { id: 'c4', name: 'Animal Adaptations' }, { id: 'c5', name: 'Climate Change' }
  ]},
  { id: 'iso7-9', name: 'Respiration in Organisms', standard: 7, olympiad: 'ISO', icon: '🫁', color: '#ec4899', description: 'Aerobic, anaerobic, breathing', chapters: [
    { id: 'c1', name: 'Breathing vs Respiration' }, { id: 'c2', name: 'Aerobic Respiration' }, { id: 'c3', name: 'Anaerobic Respiration' }, { id: 'c4', name: 'Respiration in Plants' }, { id: 'c5', name: 'Human Respiratory System' }
  ]},
  { id: 'iso7-10', name: 'Transportation in Plants & Animals', standard: 7, olympiad: 'ISO', icon: '🩸', color: '#ef4444', description: 'Circulatory, xylem/phloem', chapters: [
    { id: 'c1', name: 'Transport in Plants (Xylem)' }, { id: 'c2', name: 'Transport in Plants (Phloem)' }, { id: 'c3', name: 'Human Circulatory System' }, { id: 'c4', name: 'Blood & Blood Components' }, { id: 'c5', name: 'Excretion' }
  ]},
  { id: 'iso7-11', name: 'Reproduction in Plants', standard: 7, olympiad: 'ISO', icon: '🌸', color: '#a855f7', description: 'Sexual, asexual, pollination', chapters: [
    { id: 'c1', name: 'Sexual Reproduction' }, { id: 'c2', name: 'Asexual Reproduction' }, { id: 'c3', name: 'Pollination' }, { id: 'c4', name: 'Fertilization' }, { id: 'c5', name: 'Seed Dispersal' }
  ]},
  { id: 'iso7-12', name: 'Forest: Our Lifeline', standard: 7, olympiad: 'ISO', icon: '🌳', color: '#10b981', description: 'Ecosystem, food web, decomposers', chapters: [
    { id: 'c1', name: 'Forest Ecosystem' }, { id: 'c2', name: 'Food Web' }, { id: 'c3', name: 'Decomposers' }, { id: 'c4', name: 'Forest Conservation' }, { id: 'c5', name: 'Role of Forests' }
  ]}
];

export const getTopicsByFilter = (standard?: number, olympiad?: string): Topic[] => {
  return topics.filter(t => {
    if (standard && t.standard !== standard) return false;
    if (olympiad && t.olympiad !== olympiad) return false;
    return true;
  });
};

export const getTopicById = (id: string): Topic | undefined => {
  return topics.find(t => t.id === id);
};
