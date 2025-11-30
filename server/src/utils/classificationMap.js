// server/src/utils/classificationMap.js

/**
 * A curated map of Dewey Decimal Classification (DDC) codes to subject tags.
 * Optimized for Engineering and Science libraries.
 */
const ddcMap = {
    // --- 000: Computer Science, Information & General Works ---
    '000': ['Computer Science', 'General Knowledge'],
    '001': ['Knowledge', 'Systems'],
    '003': ['Systems', 'Computer Systems'],
    '004': ['Computer Science', 'Data Processing', 'IT'],
    '005': ['Computer Programming', 'Software', 'Data'],
    '006': ['Special Computer Methods', 'AI', 'Graphics'],
    
    // --- 300: Social Sciences (Economics, Law) ---
    '300': ['Social Sciences'],
    '330': ['Economics'],
    '340': ['Law'],
    '370': ['Education'],
    '380': ['Commerce', 'Communications', 'Transport'],

    // --- 500: Science ---
    '500': ['Science', 'Natural Sciences'],
    '510': ['Mathematics'],
    '511': ['General Principles of Mathematics'],
    '512': ['Algebra'],
    '515': ['Calculus', 'Analysis'],
    '519': ['Probabilities', 'Applied Mathematics', 'Statistics'],
    '520': ['Astronomy', 'Physics'],
    '530': ['Physics'],
    '531': ['Classical Mechanics', 'Solid Mechanics'],
    '532': ['Fluid Mechanics', 'Liquid Mechanics'],
    '533': ['Gas Mechanics'],
    '534': ['Sound', 'Vibrations'],
    '535': ['Light', 'Optics'],
    '536': ['Heat', 'Thermodynamics'],
    '537': ['Electricity', 'Electronics', 'Magnetism'],
    '539': ['Modern Physics'],
    '540': ['Chemistry'],
    '541': ['Physical Chemistry'],
    '543': ['Analytical Chemistry'],
    '546': ['Inorganic Chemistry'],
    '547': ['Organic Chemistry'],
    '550': ['Earth Sciences', 'Geology'],
    '570': ['Life Sciences', 'Biology'],

    // --- 600: Technology (Applied Sciences) ---
    '600': ['Technology'],
    '620': ['Engineering', 'Applied Physics'],
    '621': ['Mechanical Engineering', 'Electrical Engineering', 'Applied Physics'],
    '622': ['Mining Engineering'],
    '623': ['Military Engineering', 'Marine Engineering'],
    '624': ['Civil Engineering', 'Structural Engineering'],
    '625': ['Railway Engineering', 'Road Engineering'],
    '627': ['Hydraulic Engineering'],
    '628': ['Sanitary Engineering', 'Environmental Engineering'],
    '629': ['Transport Engineering', 'Automobile Engineering'],
    '650': ['Management', 'Business'],
    '658': ['General Management'],
    '660': ['Chemical Engineering'],
    '669': ['Metallurgy'],
    '670': ['Manufacturing'],
    '681': ['Precision Instruments'],
    '690': ['Buildings', 'Construction'],
    
    // --- 700: Arts ---
    '720': ['Architecture'],
    '744': ['Technical Drawing']
};

module.exports = ddcMap;