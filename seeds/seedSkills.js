const mongoose = require('mongoose');
const { Skill } = require('../models/Portfolio');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });


const skills = [
  { name: 'Web Development',         iconClass: 'fas fa-laptop-code',        description: 'Building responsive websites and apps.' },
  { name: 'Database Design',         iconClass: 'fas fa-database',           description: 'Structuring efficient relational schemas.' },
  { name: 'Digital Electronics',     iconClass: 'fas fa-microchip',          description: 'Designing circuits with logic gates.' },
  { name: 'Operating Systems',       iconClass: 'fas fa-desktop',            description: 'Managing hardware and software resources.' },
  { name: 'Boolean Logic',           iconClass: 'fas fa-project-diagram',    description: 'Applying true/false algebra for circuits.' },
  { name: 'Data Structures',         iconClass: 'fas fa-sitemap',            description: 'Organizing data in efficient formats.' },
  { name: 'Algorithms',              iconClass: 'fas fa-cogs',               description: 'Creating step-by-step computational solutions.' },
  { name: 'Networking',              iconClass: 'fas fa-network-wired',      description: 'Connecting systems via protocols and hardware.' },
  { name: 'Cybersecurity',           iconClass: 'fas fa-shield-alt',         description: 'Protecting systems from digital threats.' },
  { name: 'DevOps',                  iconClass: 'fas fa-tools',              description: 'Automating development and system operations.' },
  { name: 'Machine Learning',        iconClass: 'fas fa-robot',              description: 'Training models to learn from data.' },
  { name: 'Artificial Intelligence', iconClass: 'fas fa-brain',              description: 'Simulating human intelligence in machines.' },
  { name: 'Mobile Development',      iconClass: 'fas fa-mobile-alt',         description: 'Building applications for smartphones.' },
  { name: 'UI/UX Design',            iconClass: 'fas fa-pencil-ruler',       description: 'Designing user-friendly interfaces.' },
  { name: 'Cloud Computing',         iconClass: 'fas fa-cloud',              description: 'Delivering services over the internet.' },
  { name: 'Blockchain',              iconClass: 'fas fa-link',               description: 'Implementing decentralized ledgers.' },
  { name: 'Internet of Things',      iconClass: 'fas fa-wifi',               description: 'Connecting everyday devices online.' },
  { name: 'Game Development',        iconClass: 'fas fa-gamepad',            description: 'Creating interactive digital games.' },
  { name: 'Software Testing',        iconClass: 'fas fa-vial',               description: 'Verifying software quality and bugs.' },
  { name: 'APIs & Microservices',    iconClass: 'fas fa-server',             description: 'Building modular service endpoints.' },

  { name: 'Full-Stack Development',  iconClass: 'fas fa-code',               description: 'Handling both frontend and backend tasks.' },
  { name: 'Front-End Engineering',   iconClass: 'fas fa-html5',              description: 'Implementing visual elements for users.' },
  { name: 'Back-End Engineering',    iconClass: 'fas fa-server',             description: 'Building server-side application logic.' },
  { name: 'Data Engineering',        iconClass: 'fas fa-database',           description: 'Processing and preparing data pipelines.' },
  { name: 'Site Reliability Eng.',   iconClass: 'fas fa-life-ring',          description: 'Ensuring service uptime and performance.' },

  { name: 'Project Management',      iconClass: 'fas fa-tasks',              description: 'Planning and executing projects efficiently.' },
  { name: 'Product Management',      iconClass: 'fas fa-box-open',           description: 'Defining product vision and roadmap.' },
  { name: 'Business Analysis',       iconClass: 'fas fa-chart-line',         description: 'Analyzing processes to improve business.' },
  { name: 'Human Resources',         iconClass: 'fas fa-user-friends',       description: 'Managing employee relations and hiring.' },
  { name: 'Marketing',               iconClass: 'fas fa-bullhorn',           description: 'Promoting products to target audiences.' },
  { name: 'Sales',                   iconClass: 'fas fa-handshake',          description: 'Driving revenue through client relationships.' },
  { name: 'Customer Support',        iconClass: 'fas fa-headset',            description: 'Assisting customers with inquiries.' },

  { name: 'Graphic Design',          iconClass: 'fas fa-palette',            description: 'Creating visual content and layouts.' },
  { name: 'Video Production',        iconClass: 'fas fa-video',              description: 'Capturing and editing video content.' },
  { name: 'Photography',             iconClass: 'fas fa-camera-retro',       description: 'Taking and processing photographs.' },
  { name: 'Animation',               iconClass: 'fas fa-film',               description: 'Bringing illustrations to life.' },
  { name: 'Illustration',            iconClass: 'fas fa-pencil-alt',         description: 'Drawing digital or hand-made art.' },
  { name: 'Copywriting',             iconClass: 'fas fa-pen-nib',            description: 'Writing persuasive marketing text.' },

  { name: 'Data Visualization',      iconClass: 'fas fa-chart-pie',          description: 'Representing data graphically.' },
  { name: 'Data Science',            iconClass: 'fas fa-chart-area',         description: 'Extracting insights from complex data.' },
  { name: 'Business Intelligence',   iconClass: 'fas fa-lightbulb',          description: 'Leveraging data for decision-making.' },
  { name: 'Statistical Analysis',    iconClass: 'fas fa-percent',            description: 'Interpreting data using statistics.' },

  { name: 'Accounting',              iconClass: 'fas fa-calculator',        description: 'Recording and summarizing financials.' },
  { name: 'Financial Analysis',      iconClass: 'fas fa-dollar-sign',        description: 'Examining financial data trends.' },
  { name: 'Legal & Compliance',      iconClass: 'fas fa-balance-scale',      description: 'Ensuring adherence to laws.' },

  { name: 'Supply Chain',            iconClass: 'fas fa-shipping-fast',     description: 'Managing product movement logistics.' },
  { name: 'Logistics',               iconClass: 'fas fa-truck',              description: 'Coordinating transportation operations.' },
  { name: 'Procurement',             iconClass: 'fas fa-shopping-cart',      description: 'Acquiring goods and services.' },

  { name: 'Healthcare',              iconClass: 'fas fa-notes-medical',     description: 'Providing medical and wellness services.' },
  { name: 'Education & Training',    iconClass: 'fas fa-graduation-cap',     description: 'Teaching and learning program design.' },
  { name: 'E-Learning',              iconClass: 'fas fa-chalkboard-teacher', description: 'Online course development and delivery.' },

  { name: 'Quality Assurance',       iconClass: 'fas fa-check-circle',       description: 'Monitoring standards for quality.' },
  { name: 'Research & Development',  iconClass: 'fas fa-flask',              description: 'Innovating through experimentation.' },
  { name: 'Environmental Science',   iconClass: 'fas fa-leaf',               description: 'Studying natural environment systems.' },
  { name: 'Event Management',        iconClass: 'fas fa-calendar-alt',       description: 'Organizing and running events.' },
  { name: 'Writing & Editing',       iconClass: 'fas fa-book',               description: 'Crafting and refining written content.' }
];

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI;
    

    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });

    await Skill.deleteMany({});
    const inserted = await Skill.insertMany(skills);
    console.log(`Inserted ${inserted.length} skills`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err && err.message ? err.message : err);
    console.error(err);
    process.exit(1);
  }
}

seed();