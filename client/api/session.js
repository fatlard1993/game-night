import { GET, POST, DELETE } from '@vanilla-bean/hypertether';

export const getSession = async options => await GET('/api/session', { apiId: 'session', ...options });

// Every mutating endpoint is gated on the session cookie this sets, so a successful login or
// logout invalidates the views that decide what to show based on it
export const logIn = async options => await POST('/api/session', { invalidates: ['session'], ...options });

export const logOut = async options => await DELETE('/api/session', { invalidates: ['session'], ...options });
