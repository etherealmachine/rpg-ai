import {
  IconDefinition,
  IconLookup,
  IconName
} from '@fortawesome/fontawesome-svg-core';

export const textIcon: IconDefinition & IconLookup = {
  prefix: 'fab',
  iconName: 'text' as IconName,
  icon: [
    448,
    512,
    [],
    'none',
    'M432 32a16 16 0 0 1 16 16v96a16 16 0 0 1-16 16h-32a16 16 0 0 1-16-16v-32H264v304h40a16 16 0 0 1 16 16v32a16 16 0 0 1-16 16H144a16 16 0 0 1-16-16v-32a16 16 0 0 1 16-16h40V112H64v32a16 16 0 0 1-16 16H16a16 16 0 0 1-16-16V48a16 16 0 0 1 16-16z'
  ]
};

export const stairsIcon: IconDefinition & IconLookup = {
  prefix: 'fab',
  iconName: 'stairs' as IconName,
  icon: [
    100,
    100,
    [],
    'none',
    'M 88.894187,13.349653 H 75.858354 67.310207 v 8.548146 13.036436 H 54.274372 45.726226 v 8.548149 13.035835 H 32.689789 24.141641 v 8.548147 13.035835 H 2.557659 v 8.548146 h 30.13213 V 78.1022 65.066366 H 54.274372 V 56.518219 43.482384 H 75.858354 V 34.934235 21.897799 h 13.035833 8.548154 v -8.548146 z',
  ]
};