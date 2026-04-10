import { VIDEO_LIBRARY } from '../data/videoData.js';
import { analyticsService } from './analyticsService.js';

export const insightService = {
  generateRoadmap(sessions, scores) {
    const consistency = analyticsService.calculateConsistency(sessions);
    const lastScore = scores.length ? scores[scores.length-1].pct : -1;
    const avgDur = sessions.length ? sessions.reduce((a,s)=>a+s.duration,0)/sessions.length : 0;
    const avgFocus = sessions.length ? sessions.reduce((a,s)=>a+(s.focus||3),0)/sessions.length : 3;
    const best = analyticsService.getBestTimeSlot(sessions);
    const steps = [];
    steps.push({ num:1, title:'Study During Your Best Time', desc:`Schedule your sessions during ${best} for maximum effectiveness.`, action:'View Tracker', page:'tracker' });
    if (consistency < 70) steps.push({ num:2, title:'Build a 5-Day Study Streak', desc:`Your consistency is ${consistency}%. Aim to study 5+ days this week.`, action:'Start Tracking', page:'tracker' });
    if (lastScore >= 0 && lastScore < 70) steps.push({ num:3, title:'Retake the Assessment', desc:`Your last score was ${lastScore}%. A retake can boost your effectiveness score.`, action:'Take Quiz', page:'assessment' });
    if (lastScore < 0) steps.push({ num:3, title:'Take Your First Assessment', desc:'No quiz score yet. Take the assessment to unlock full analytics.', action:'Take Quiz', page:'assessment' });
    if (avgDur > 60) steps.push({ num:4, title:'Break Into 45-Minute Blocks', desc:`Your avg session is ${Math.round(avgDur)} min. Try 45-min focused blocks with breaks.`, action:'Start Session', page:'tracker' });
    if (avgDur > 0 && avgDur < 20) steps.push({ num:4, title:'Extend Sessions to 30–45 Minutes', desc:`Your avg is only ${Math.round(avgDur)} min. Longer sessions allow deeper learning.`, action:'Start Session', page:'tracker' });
    if (avgFocus < 3) steps.push({ num:5, title:'Improve Your Focus Environment', desc:`Avg focus ${avgFocus.toFixed(1)}/5. Reduce phone distractions and find a quieter space.`, action:'Log Session', page:'tracker' });
    return steps.slice(0,5);
  },

  recommendVideos(sessions, scores) {
    const lastScore = scores.length ? scores[scores.length-1].pct : 100;
    const consistency = analyticsService.calculateConsistency(sessions);
    const improvement = analyticsService.calculateImprovement(scores);
    const avgEff = analyticsService.calculateEffectiveness(sessions);
    let vids = [];
    if (lastScore < 70) vids.push(...VIDEO_LIBRARY.filter(v => v.tags.includes('basics')));
    if (improvement < 0) vids.push(...VIDEO_LIBRARY.filter(v => v.tags.includes('productivity')));
    if (avgEff < 0.05) vids.push(...VIDEO_LIBRARY.filter(v => v.tags.includes('ds') || v.tags.includes('algo')));
    if (consistency < 50) vids.push(...VIDEO_LIBRARY.filter(v => v.tags.includes('focus')));
    if (!vids.length) vids = VIDEO_LIBRARY.slice(0, 4);
    const unique = [...new Map(vids.map(v=>[v.title,v])).values()].slice(0,4);
    return unique;
  }
};