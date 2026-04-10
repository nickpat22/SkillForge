import { database } from '../db/database.js';
import { avgEffectiveness, computeSlotEffectiveness, bestTimeSlot, calcConsistency, calcStreak, calcImprovement, getWeeklyCounts, getWeeklyMinutes } from '../../core/utils.js';

export const analyticsService = {
  calculateEffectiveness(sessions) {
    return avgEffectiveness(sessions);
  },

  calculateConsistency(sessions) {
    return calcConsistency(sessions);
  },

  calculateStreak(sessions) {
    return calcStreak(sessions);
  },

  calculateImprovement(scores) {
    return calcImprovement(scores);
  },

  getBestTimeSlot(sessions) {
    return bestTimeSlot(sessions);
  },

  getWeeklyActivity(sessions) {
    return getWeeklyCounts(sessions);
  },

  getWeeklyMinutes(sessions) {
    return getWeeklyMinutes(sessions);
  },

  getSlotEffectiveness(sessions) {
    return computeSlotEffectiveness(sessions);
  },

  generateInsights(sessions, scores) {
    const slotEff = this.getSlotEffectiveness(sessions);
    const best = Object.entries(slotEff).sort((a,b)=>b[1]-a[1])[0] || ['—', 0];
    const avgDur = sessions.length ? sessions.reduce((a,s)=>a+s.duration,0)/sessions.length : 0;
    const consistency = this.calculateConsistency(sessions);
    const avgFocus = sessions.length ? sessions.reduce((a,s)=>a+(s.focus||3),0)/sessions.length : 3;
    const improvement = this.calculateImprovement(scores);
    const morningEff = slotEff.Morning || 0;
    const nightEff = slotEff.Night || 0;
    const insights = [];
    if (best[1] > 0) insights.push({ icon:'⚡', iconBg:'#DBEAFE', type:'positive', title:'Peak Performance Window', desc:`Your ${best[0]} sessions have the highest effectiveness score. Schedule important study sessions during this time.`, data:`${best[0]}: ${(best[1]*100).toFixed(2)}% effectiveness` });
    if (avgDur > 60) insights.push({ icon:'⏳', iconBg:'#FEF3C7', type:'warning', title:'Sessions May Be Too Long', desc:'Focus and retention decline after 60 minutes. Try breaking into shorter focused blocks.', data:`Your average: ${Math.round(avgDur)} minutes per session` });
    if (avgDur < 20 && avgDur > 0) insights.push({ icon:'⏱', iconBg:'#CFFAFE', type:'info', title:'Sessions Are Too Short', desc:'Sessions under 20 minutes may not allow deep learning. Try extending to 30–45 minutes.', data:`Your average: ${Math.round(avgDur)} minutes` });
    if (consistency < 50) insights.push({ icon:'📅', iconBg:'#FEE2E2', type:'alert', title:'Low Weekly Consistency', desc:'Consistent daily study beats long occasional sessions. Try to study at least 4–5 days per week.', data:`This week: ${consistency}% consistency` });
    if (consistency >= 80) insights.push({ icon:'🔥', iconBg:'#D1FAE5', type:'positive', title:'Excellent Consistency!', desc:"You're studying consistently! This habit will compound into major improvements over time.", data:`Consistency: ${consistency}%` });
    if (avgFocus < 2.5) insights.push({ icon:'😴', iconBg:'#FEF3C7', type:'warning', title:'Focus Ratings Are Low', desc:'Low focus sessions reduce effectiveness. Try eliminating distractions: phone, notifications, noise.', data:`Average focus: ${avgFocus.toFixed(1)}/5` });
    if (avgFocus >= 4) insights.push({ icon:'🧠', iconBg:'#D1FAE5', type:'positive', title:'Excellent Focus Level!', desc:'High focus during study sessions greatly amplifies learning outcomes. Keep it up!', data:`Average focus: ${avgFocus.toFixed(1)}/5` });
    if (improvement > 0) insights.push({ icon:'📈', iconBg:'#D1FAE5', type:'positive', title:'Your Scores Are Improving!', desc:"Great news! Your recent quiz scores are higher than your earlier ones. You're making measurable progress.", data:`Improvement: +${improvement}%` });
    if (improvement < -10) insights.push({ icon:'📉', iconBg:'#EDE9FE', type:'tip', title:'Scores Have Declined', desc:'Your recent scores are lower than earlier ones. Consider reviewing material and taking more frequent quizzes.', data:`Decline: ${improvement}%` });
    if (morningEff > 0 && nightEff > 0 && morningEff > nightEff * 1.2) insights.push({ icon:'🌅', iconBg:'#FEF3C7', type:'tip', title:'Morning Beats Night Study', desc:'Your morning sessions are significantly more effective than night sessions. Try shifting study time earlier.', data:`Morning: ${(morningEff*100).toFixed(2)}% vs Night: ${(nightEff*100).toFixed(2)}%` });
    return insights;
  }
};