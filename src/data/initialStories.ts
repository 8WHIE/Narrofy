import { Story, FeedPost } from '../types';

export const INITIAL_SHOWCASE_STORIES: Story[] = [
  {
    id: 'story_solaris_chronicles',
    authorId: 'creator_elena_vance',
    authorName: 'Elena Vance',
    authorUsername: 'elenavance',
    authorPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    title: 'The Clockwork Citadel of Aethelgard',
    description: 'In an altitude realm where brass gears govern the rising and setting of celestial bodies, an apprentice clockmaker discovers a forbidden mechanism that does not count time—it reverses it.',
    coverImageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    category: 'fantasy',
    tags: ['steampunk', 'fantasy', 'mystery', 'magic'],
    language: 'English',
    content: 'The brass pendulums of Aethelgard never wavered. For six centuries, the Grand Chronometer sustained the heartbeat of the floating spires...',
    chapters: [
      {
        id: 'ch_1',
        title: 'Chapter 1: The Midnight Cog',
        order: 1,
        content: `The brass pendulums of Aethelgard never wavered. For six centuries, the Grand Chronometer sustained the heartbeat of the floating spires. To tamper with a single gear was considered high treason against the Celestial Order.

Kaelen knelt on the cold obsidian tiles of the upper atrium. His brass calipers trembled as he illuminated the recessed niche behind the fourteenth cylinder. It was not listed on any blueprint. It did not tick in rhythm with the sun-gear.

It beat like a heart.

"You should not be up here after curfew, apprentice," whispered a voice from the arched colonnade.

Kaelen quickly closed his satchel, his pulse quickening against his ribs.`,
      },
      {
        id: 'ch_2',
        title: 'Chapter 2: Whisper of the Sunken Spire',
        order: 2,
        content: `Master Orin stood beneath the shadow of the silver lunarium. His robotic ocular lens clicked with microscopic precision as he regarded Kaelen.

"The archives speak of a seventh key, boy," Orin murmured, stepping closer until the smell of heated lubricant and old parchment enveloped them. "They claim the Citadel did not ascend to escape the deluge. It ascended to escape what was sleeping beneath."

Kaelen held his breath. From his pocket, the anomalous brass gear hummed with warm amber luminescence.`,
      },
    ],
    media: [
      {
        url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
        type: 'image',
        caption: 'The Upper Spires of Aethelgard at twilight',
      },
    ],
    status: 'published',
    publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    views: 1420,
    likesCount: 238,
    commentsCount: 34,
    sharesCount: 19,
  },
  {
    id: 'story_echoes_of_titan',
    authorId: 'creator_marcus_reid',
    authorName: 'Marcus Reid',
    authorUsername: 'marcusreid_astro',
    authorPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    title: 'Echoes in the Methane Seas',
    description: 'During a survey mission on Saturn’s moon Titan, hydro-geologist Dr. Noah Vance detects a repeating acoustic frequency emitting from three kilometers beneath the hydrocarbon ice.',
    coverImageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
    category: 'scifi',
    tags: ['space', 'scifi', 'exploration', 'hard-scifi'],
    language: 'English',
    content: 'The liquid methane of Kraken Mare was as dark as obsidian glass. The submarine probe drifted silently at forty fathoms...',
    chapters: [
      {
        id: 'ch_1',
        title: 'Chapter 1: The Kraken Signal',
        order: 1,
        content: `The liquid methane of Kraken Mare was as dark as obsidian glass. The exploration drone Calypso drifted silently at forty fathoms, its sonar pinging against subterranean methane ice floes.

"Re-run telemetry on hydrophone three," Noah instructed, wiping condensation off the console visor.

"Telemetry confirmed, Doctor," replied the automated synthetic module. "The frequency is 432 Hertz. Modulated in prime intervals. Source distance: 820 meters directly beneath our keel."

Noah tapped the headset. Across forty astronomical minutes of radio delay, Earth had no idea what was stirring in the outer system.`,
      },
    ],
    media: [
      {
        url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
        type: 'image',
        caption: 'Kraken Mare sensor array projection',
      },
    ],
    status: 'published',
    publishedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    views: 2890,
    likesCount: 412,
    commentsCount: 56,
    sharesCount: 45,
  },
  {
    id: 'story_neon_symphony',
    authorId: 'creator_aya_sato',
    authorName: 'Aya Sato',
    authorUsername: 'ayasato_neo',
    authorPhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    title: 'Neon Ghosts of District 9',
    description: 'In Neo-Kyoto, memory couriers deliver classified memories directly between neural nodes. When Ren accidentally unseals a memory capsule belonging to an oligarch, he realizes it isn’t a memory—it’s an execution list.',
    coverImageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
    category: 'thriller',
    tags: ['cyberpunk', 'noir', 'thriller', 'mystery'],
    language: 'English',
    content: 'Rain washed the neon reflections down the chrome alleys of the lower tier. Ren adjusted his synaptic cowl and ducked into the tea house...',
    chapters: [
      {
        id: 'ch_1',
        title: 'Chapter 1: The Sealed Synapse',
        order: 1,
        content: `Rain washed the neon reflections down the chrome alleys of the lower tier. Ren adjusted his synaptic cowl and ducked into the alleyway beneath the holographic billboard of Shinra Bio-Tech.

The encrypted chip behind his ear was burning at 39 degrees Celsius. Courier protocol was simple: do not decrypt, do not sync, do not remember.

He pressed his thumb against the neural port. A crimson flash tore through his optic nerves. A face appeared in ultra-high definition—his own.`,
      },
    ],
    media: [
      {
        url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
        type: 'image',
        caption: 'District 9 mid-level crossing at midnight',
      },
    ],
    status: 'published',
    publishedAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    views: 1950,
    likesCount: 320,
    commentsCount: 42,
    sharesCount: 31,
  },
];

export const INITIAL_SHOWCASE_POSTS: FeedPost[] = [
  {
    id: 'post_welcome_1',
    authorId: 'creator_elena_vance',
    authorName: 'Elena Vance',
    authorUsername: 'elenavance',
    authorPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    content: 'Drafting Chapter 3 of "The Clockwork Citadel" tonight! When writing fantasy technology, how much do you explain to the reader vs letting the world breathe on its own?',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    likesCount: 45,
    commentsCount: 12,
  },
  {
    id: 'post_welcome_2',
    authorId: 'creator_marcus_reid',
    authorName: 'Marcus Reid',
    authorUsername: 'marcusreid_astro',
    authorPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    content: 'Excited to publish on Narrofy! The 24-hour edit rule really makes you deliberate before hitting publish. Loving the atmosphere and community here.',
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    likesCount: 88,
    commentsCount: 19,
  },
];
