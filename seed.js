const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
require('dotenv/config');

async function bootstrap() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }
  if (!process.env.MONGODB_DB_NAME) {
    throw new Error('MONGODB_DB_NAME environment variable is not set');
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME);

  const usersCollection = db.collection('users');
  const jobDescriptionsCollection = db.collection('jobdescriptions');

  console.log('Seeding database...');

  // Upsert Admin User
  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash('Admin@123', salt);

  await usersCollection.updateOne(
    { email: 'admin@example.com' },
    {
      $set: {
        username: 'Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        summary: '',
        chats: [],
        weights: [],
        created_at: new Date(),
        updated_at: new Date(),
      },
    },
    { upsert: true },
  );

  console.log('Admin user upserted.');

  // Upsert Job Descriptions
  const jobDescriptions = [
    {
      title: 'Senior Software Engineer',
      description: 'We are looking for a Senior Software Engineer to join our team.',
      requirements: ['5+ years of experience in software development', 'Proficiency in TypeScript and Node.js', 'Experience with NestJS is a plus'],
    },
    {
      title: 'Frontend Developer',
      description: 'We are looking for a Frontend Developer to build beautiful and responsive user interfaces.',
      requirements: ['3+ years of experience in frontend development', 'Proficiency in React or Vue.js', 'Strong understanding of HTML, CSS, and JavaScript'],
    },
    {
      title: 'Data Scientist',
      description: 'Join our data science team to analyze large datasets and build predictive models.',
      requirements: ['PhD or Masters in a quantitative field', 'Experience with Python, R, and SQL', 'Knowledge of machine learning frameworks like TensorFlow or PyTorch'],
    },
    {
      title: 'DevOps Engineer',
      description: 'We need a DevOps Engineer to manage our CI/CD pipelines and cloud infrastructure.',
      requirements: ['Experience with Docker, Kubernetes, and Jenkins', 'Proficiency in scripting languages like Bash or Python', 'Experience with AWS, GCP, or Azure'],
    },
    {
      title: 'Product Manager',
      description: 'Define product vision, strategy, and roadmap for our innovative products.',
      requirements: ['5+ years of product management experience', 'Excellent communication and leadership skills', 'Experience in an Agile development environment'],
    },
    {
      title: 'UI/UX Designer',
      description: 'Create intuitive and visually appealing user interfaces and experiences.',
      requirements: ['Portfolio of design projects', 'Proficiency in design tools like Figma, Sketch, or Adobe XD', 'Understanding of user-centered design principles'],
    },
    {
      title: 'QA Engineer',
      description: 'Ensure the quality of our software through manual and automated testing.',
      requirements: ['Experience with testing frameworks like Selenium or Cypress', 'Strong attention to detail', 'Experience with bug tracking systems like Jira'],
    },
    {
      title: 'Mobile Developer (iOS)',
      description: 'Develop and maintain our native iOS application.',
      requirements: ['Proficiency in Swift and SwiftUI', 'Experience with iOS frameworks like Core Data and Core Animation', 'Published one or more apps to the App Store'],
    },
    {
      title: 'Mobile Developer (Android)',
      description: 'Develop and maintain our native Android application.',
      requirements: ['Proficiency in Kotlin and Jetpack Compose', 'Experience with Android SDK', 'Published one or more apps to the Google Play Store'],
    },
    {
      title: 'Backend Engineer',
      description: 'Build and maintain the server-side logic of our applications.',
      requirements: ['Experience with backend languages like Go, Java, or Python', 'Knowledge of database technologies like PostgreSQL or MongoDB', 'Experience building RESTful APIs'],
    },
  ];

  const bulkOps = jobDescriptions.map((job) => ({
    updateOne: {
      filter: { title: job.title },
      update: { $set: { ...job, created_at: new Date(), updated_at: new Date() } },
      upsert: true,
    },
  }));

  if (bulkOps.length > 0) {
    await jobDescriptionsCollection.bulkWrite(bulkOps);
  }

  console.log(`${jobDescriptions.length} job descriptions upserted.`);

  console.log('Seeding complete!');
  await client.close();
}

bootstrap().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});