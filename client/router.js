import { Router } from '@vanilla-bean/components';

import Games from './Games/Games';
import GamePage from './GamePage/GamePage';
import { registerRouter } from './navigate';

const router = new Router({ mode: 'history', views: { '/games': Games, '/games/:id': GamePage } });

// Views call navigate() from ./navigate; this is the end that supplies it
registerRouter(router);

export default router;
