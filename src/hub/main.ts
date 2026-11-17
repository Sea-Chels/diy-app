import '@fontsource/bangers';
import '../shared/base.css';
import './hub.css';
import { hydrateIcons } from '../shared/icons';
import { initCarousel } from './carousel';
import { initNav } from './nav';

hydrateIcons();
const carousel = initCarousel(document.getElementById('carousel')!);
initNav(carousel);
