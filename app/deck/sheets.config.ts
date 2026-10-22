import type { SheetDef } from './types'

export const sheets: SheetDef[] = [
  { id: 'intro', title: 'Intro', mode: 'single', component: 'IntroSheet' },
  {
    id: 'clay',
    path: '/projects/clay',
    title: 'Clay',
    mode: 'stack',
    slides: [
      { id: 'main', component: 'FlagshipSheet', props: { project: 'clay', visual: 'left' } },
      { id: 'readme', component: 'ReadmeSlide', props: { project: 'clay' } },
    ],
  },
  {
    id: 'osmium',
    path: '/projects/osmium',
    title: 'Osmium',
    mode: 'stack',
    slides: [
      { id: 'main', component: 'FlagshipSheet', props: { project: 'osmium', visual: 'left' } },
      { id: 'readme', component: 'ReadmeSlide', props: { project: 'osmium' } },
    ],
  },
  {
    id: 'forkcast',
    path: '/projects/forkcast',
    title: 'Forkcast',
    mode: 'stack',
    slides: [
      { id: 'main', component: 'FlagshipSheet', props: { project: 'forkcast', visual: 'right' } },
      { id: 'readme', component: 'ReadmeSlide', props: { project: 'forkcast' } },
    ],
  },
  {
    id: 'backbone',
    path: '/projects/backbone',
    title: 'Backbone',
    mode: 'stack',
    slides: [
      { id: 'main', component: 'FlagshipSheet', props: { project: 'backbone', visual: 'right' } },
      { id: 'readme', component: 'ReadmeSlide', props: { project: 'backbone' } },
    ],
  },
  {
    id: 'helix',
    path: '/projects/helix',
    title: 'Helix',
    mode: 'stack',
    slides: [
      { id: 'main', component: 'FlagshipSheet', props: { project: 'helix', visual: 'left' } },
      { id: 'readme', component: 'ReadmeSlide', props: { project: 'helix' } },
    ],
  },
  {
    id: 'projects',
    title: 'Projects',
    mode: 'stack',
    slides: [
      { id: 'main', component: 'ProjectListSlide', props: { tier: 'featured' } },
      { id: 'more', component: 'ProjectListSlide', props: { tier: 'more' } },
    ],
  },
  {
    id: 'posts',
    title: 'Posts',
    mode: 'stack',
    // the list on top, then one page per post below it
    slides: [{ id: 'list', component: 'PostFeedSheet' }],
    slidesFrom: 'posts',
  },
  { id: 'timeline', title: 'Timeline', mode: 'single', component: 'TimelineSheet' },
  { id: 'skills', title: 'Skills', mode: 'single', component: 'SkillsSheet' },
  { id: 'contact', title: 'Contact', mode: 'single', component: 'ContactSheet' },
]
