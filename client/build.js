import { buildClient } from '@vanilla-bean/components/app';

// Root-absolute asset URLs so deep history routes (/games/:id) still resolve chunks
const { success } = await buildClient({ publicPath: '/' });

if (!success) process.exit(1);
