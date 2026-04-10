import { LADDER_TRACKS } from '../data/roadmapData.js';
import { database } from '../db/database.js';

export const plannerService = {
  generateRoadmap(topic, goal, hours) {
    // Simple logic based on topic
    const trackKey = topic.toLowerCase().includes('python') ? 'python' : topic.toLowerCase().includes('dsa') || topic.toLowerCase().includes('data') ? 'dsa' : 'js';
    const track = LADDER_TRACKS[trackKey];
    const weeks = Math.ceil(60 / hours);
    return {
      topic,
      goal,
      hours,
      weeks,
      trackKey,
      track
    };
  },

  getTrack(trackKey) {
    return LADDER_TRACKS[trackKey];
  },

  getStep(trackKey, stepId) {
    const track = LADDER_TRACKS[trackKey];
    return track ? track.steps.find(s => s.id === stepId) : null;
  },

  async updateModuleProgress(trackKey, stepId, completed) {
    const progress = database.getLocal('ladder_progress') || {};
    if (!progress[trackKey]) progress[trackKey] = {};
    progress[trackKey][stepId] = { completed, date: new Date().toISOString() };
    await database.saveLadderProgress(progress);
  },

  getProgress(trackKey) {
    const progress = database.getLocal('ladder_progress') || {};
    const trackProg = progress[trackKey] || {};
    const track = LADDER_TRACKS[trackKey];
    if (!track) return { completed: 0, total: 0 };
    const completed = track.steps.filter(s => trackProg[s.id]?.completed).length;
    return { completed, total: track.steps.length };
  }
};