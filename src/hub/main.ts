import '@fontsource/bangers';
import '../shared/base.css';
import './hub.css';
import { hydrateIcons } from '../shared/icons';
import { hideLoader } from '../shared/loader';
import { initCarousel } from './carousel';
import { initNav } from './nav';

hydrateIcons();
initCarousel(document.getElementById('carousel')!);
initNav();

// Wait for the comic font so the hub doesn't flash in a fallback face.
document.fonts.ready.then(hideLoader);
