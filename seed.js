// database seed script - populates lessons collection with sample data
import 'dotenv/config'
import { MongoClient, ServerApiVersion } from 'mongodb'

const mongodburi = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/academy'

// sample lesson data to seed the database
const samplelessons = [
  {
    topic: 'mathematics', location: 'hendon', price: 100, spaces: 5, icon: 'fa-calculator',
    description: 'comprehensive mathematics tutoring covering advanced topics including calculus, algebra, and statistics',
    instructor: 'dr sarah johnson', instructorbio: 'phd in mathematics from oxford university with 15 years teaching experience. specializes in making complex mathematical concepts accessible and engaging.',
    duration: '90 minutes', schedule: 'tuesdays and thursdays 6:00-7:30pm', skillLevel: 'advanced',
    prerequisites: ['gcse mathematics grade a', 'basic calculus knowledge'],
    learningOutcomes: ['master advanced calculus techniques', 'solve complex statistical problems', 'prepare for university mathematics courses'],
    testimonials: [{ name: 'alex chen', text: 'dr johnson transformed my understanding of mathematics. her teaching style is exceptional.', rating: 5 }]
  },
  {
    topic: 'mathematics', location: 'colindale', price: 80, spaces: 5, icon: 'fa-calculator',
    description: 'foundation mathematics for students building core skills in arithmetic, basic algebra, and geometry',
    instructor: 'mr david wright', instructorbio: 'certified mathematics teacher with 10 years experience helping students build confidence in numeracy and problem-solving.',
    duration: '60 minutes', schedule: 'mondays and wednesdays 4:00-5:00pm', skillLevel: 'beginner',
    prerequisites: ['basic arithmetic skills'],
    learningOutcomes: ['develop strong number sense', 'master basic algebraic operations', 'build confidence in mathematical thinking'],
    testimonials: [{ name: 'emma taylor', text: 'perfect for building confidence. mr wright is very patient and encouraging.', rating: 4 }]
  },
  {
    topic: 'mathematics', location: 'brent cross', price: 90, spaces: 5, icon: 'fa-calculator',
    description: 'intermediate mathematics bridging the gap between basic and advanced topics with focus on problem-solving',
    instructor: 'ms rachel green', instructorbio: 'masters in applied mathematics and educational psychology. expert at identifying and addressing learning gaps in mathematical understanding.',
    duration: '75 minutes', schedule: 'saturdays 10:00-11:15am', skillLevel: 'intermediate',
    prerequisites: ['completed basic mathematics', 'comfortable with fractions and decimals'],
    learningOutcomes: ['solve multi-step problems', 'understand mathematical reasoning', 'prepare for advanced mathematics'],
    testimonials: [{ name: 'james wilson', text: 'ms green helped me bridge the gap to a-level mathematics successfully.', rating: 5 }]
  },
  {
    topic: 'english', location: 'hendon', price: 95, spaces: 5, icon: 'fa-book-open',
    description: 'comprehensive english literature and creative writing course exploring classic and contemporary works',
    instructor: 'prof michael thompson', instructorbio: 'former university lecturer in english literature with published works in poetry and literary criticism. passionate about developing critical thinking through literature.',
    duration: '2 hours', schedule: 'fridays 6:00-8:00pm', skillLevel: 'advanced',
    prerequisites: ['gcse english grade b or above', 'strong reading comprehension'],
    learningOutcomes: ['analyze complex literary texts', 'develop personal writing style', 'understand literary movements and contexts'],
    testimonials: [{ name: 'sophia martinez', text: 'prof thompson opened my eyes to the beauty of literature. inspiring teaching.', rating: 5 }]
  },
  {
    topic: 'english', location: 'golders green', price: 85, spaces: 5, icon: 'fa-book-open',
    description: 'essential english language skills focusing on grammar, vocabulary, and communication for everyday and academic use',
    instructor: 'ms claire anderson', instructorbio: 'qualified english teacher and examiner with expertise in language acquisition and communication skills development.',
    duration: '90 minutes', schedule: 'sundays 2:00-3:30pm', skillLevel: 'beginner to intermediate',
    prerequisites: ['basic english understanding'],
    learningOutcomes: ['improve grammar and vocabulary', 'enhance written communication', 'build confidence in spoken english'],
    testimonials: [{ name: 'ahmed hassan', text: 'ms anderson helped me improve my english dramatically in just a few months.', rating: 4 }]
  },
  {
    topic: 'science', location: 'hendon', price: 110, spaces: 5, icon: 'fa-flask',
    description: 'advanced physics and chemistry covering mechanics, thermodynamics, and organic chemistry with hands-on experiments',
    instructor: 'dr elena petrov', instructorbio: 'phd in theoretical physics and former research scientist. brings real-world scientific experience into engaging practical lessons.',
    duration: '2.5 hours', schedule: 'saturdays 1:00-3:30pm', skillLevel: 'advanced',
    prerequisites: ['a-level mathematics', 'basic chemistry knowledge'],
    learningOutcomes: ['understand advanced physics principles', 'master chemical reactions and equations', 'develop laboratory skills'],
    testimonials: [{ name: 'ryan patel', text: 'dr petrov makes complex physics concepts crystal clear. excellent practical work.', rating: 5 }]
  },
  {
    topic: 'science', location: 'wembley', price: 105, spaces: 5, icon: 'fa-flask',
    description: 'biology and general science exploring life processes, ecology, and scientific methodology',
    instructor: 'dr maria santos', instructorbio: 'phd in molecular biology with research background in genetics. passionate about making biology accessible and relevant to everyday life.',
    duration: '2 hours', schedule: 'thursdays 5:00-7:00pm', skillLevel: 'intermediate',
    prerequisites: ['gcse science', 'interest in life sciences'],
    learningOutcomes: ['understand biological processes', 'learn scientific method', 'explore environmental science'],
    testimonials: [{ name: 'lucy brown', text: 'dr santos made biology fascinating. great real-world examples.', rating: 4 }]
  },
  {
    topic: 'history', location: 'brent cross', price: 75, spaces: 5, icon: 'fa-landmark',
    description: 'world history and geography covering major civilizations, historical events, and their global impact',
    instructor: 'mr robert clarke', instructorbio: 'history graduate from cambridge with 12 years teaching experience. specializes in making historical events come alive through storytelling.',
    duration: '90 minutes', schedule: 'wednesdays 7:00-8:30pm', skillLevel: 'all levels',
    prerequisites: ['curiosity about the past'],
    learningOutcomes: ['understand major historical periods', 'analyze cause and effect in history', 'develop critical thinking about sources'],
    testimonials: [{ name: 'tom davies', text: 'mr clarke brings history to life. engaging and informative lessons.', rating: 5 }]
  },
  {
    topic: 'art', location: 'golders green', price: 70, spaces: 5, icon: 'fa-palette',
    description: 'creative arts and design covering painting, drawing, sculpture, and digital art techniques',
    instructor: 'ms anna kowalski', instructorbio: 'professional artist and art therapist with exhibitions in london galleries. believes in nurturing creativity and personal expression through art.',
    duration: '2.5 hours', schedule: 'saturdays 10:00am-12:30pm', skillLevel: 'all levels',
    prerequisites: ['enthusiasm for creativity'],
    learningOutcomes: ['master basic art techniques', 'develop personal artistic style', 'understand art history and movements'],
    testimonials: [{ name: 'sarah kim', text: 'ms kowalski helped me discover my artistic voice. wonderfully supportive.', rating: 5 }]
  },
  {
    topic: 'music', location: 'hendon', price: 80, spaces: 5, icon: 'fa-music',
    description: 'instrumental and vocal training covering music theory, performance techniques, and composition',
    instructor: 'mr francesco rossi', instructorbio: 'professional musician and composer with conservatory training. performs regularly in london orchestras and teaches students of all abilities.',
    duration: '60 minutes', schedule: 'flexible scheduling available', skillLevel: 'beginner to advanced',
    prerequisites: ['basic musical interest'],
    learningOutcomes: ['learn instrument or vocal techniques', 'understand music theory', 'develop performance confidence'],
    testimonials: [{ name: 'daniel lee', text: 'mr rossi is an inspiring teacher. my piano skills improved dramatically.', rating: 5 }]
  },
  {
    topic: 'computing', location: 'colindale', price: 120, spaces: 5, icon: 'fa-laptop-code',
    description: 'programming and computer skills covering python, web development, and software engineering fundamentals',
    instructor: 'ms priya sharma', instructorbio: 'senior software engineer with 8 years industry experience at tech companies. passionate about teaching practical programming skills.',
    duration: '2 hours', schedule: 'tuesdays 7:00-9:00pm', skillLevel: 'beginner to intermediate',
    prerequisites: ['basic computer literacy'],
    learningOutcomes: ['learn programming fundamentals', 'build web applications', 'understand software development lifecycle'],
    testimonials: [{ name: 'mike johnson', text: 'ms sharma taught me programming from scratch. excellent practical approach.', rating: 5 }]
  },
  {
    topic: 'french', location: 'wembley', price: 90, spaces: 5, icon: 'fa-language',
    description: 'french language learning from basics to conversation, covering grammar, vocabulary, and cultural understanding',
    instructor: 'mme isabelle dubois', instructorbio: 'native french speaker with masters in french linguistics. lived in paris for 20 years before moving to london to teach.',
    duration: '90 minutes', schedule: 'mondays 6:30-8:00pm', skillLevel: 'beginner to intermediate',
    prerequisites: ['enthusiasm for languages'],
    learningOutcomes: ['achieve conversational french', 'understand french culture', 'prepare for french examinations'],
    testimonials: [{ name: 'olivia white', text: 'mme dubois made learning french enjoyable. authentic cultural insights.', rating: 4 }]
  }
]

// seed function - clears and repopulates the lessons collection
async function seeddata() {
  // hide password in console output
  console.log('attempting to connect to:', mongodburi.replace(/:[^:@]+@/, ':****@'))

  const client = new MongoClient(mongodburi, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    serverSelectionTimeoutMS: 60000,
    connectTimeoutMS: 60000,
    socketTimeoutMS: 60000
  })

  try {
    console.log('connecting...')
    await client.connect()
    console.log('connected to mongodb')
    
    const db = client.db('academy')
    
    // clear existing lessons
    await db.collection('lessons').deleteMany({})
    console.log('cleared existing lessons')
    
    // insert sample lessons
    const result = await db.collection('lessons').insertMany(samplelessons)
    console.log(`inserted ${result.insertedCount} lessons`)
    
    // display inserted lessons
    const lessons = await db.collection('lessons').find({}).toArray()
    console.log('lessons in database:')
    lessons.forEach(lesson => {
      console.log(`- ${lesson.topic} at ${lesson.location} - ${lesson.price}`)
    })
    
  } catch (error) {
    console.error('error seeding data:', error)
  } finally {
    await client.close()
    console.log('disconnected from mongodb')
  }
}

// run seed function
seeddata()

