'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.CampaignStatus =
  exports.CampaignType =
  exports.AgentStatus =
  exports.AgentType =
    void 0;
var AgentType;
(function (AgentType) {
  AgentType['CONTENT_CREATOR'] = 'CONTENT_CREATOR';
  AgentType['TREND_ANALYZER'] = 'TREND_ANALYZER';
  AgentType['OUTREACH_MANAGER'] = 'OUTREACH_MANAGER';
  AgentType['PERFORMANCE_OPTIMIZER'] = 'PERFORMANCE_OPTIMIZER';
  AgentType['AUDIENCE_RESEARCH'] = 'AUDIENCE_RESEARCH';
  AgentType['SEO'] = 'SEO';
  AgentType['CUSTOMER_SUPPORT'] = 'CUSTOMER_SUPPORT';
})(AgentType || (exports.AgentType = AgentType = {}));
var AgentStatus;
(function (AgentStatus) {
  AgentStatus['IDLE'] = 'IDLE';
  AgentStatus['RUNNING'] = 'RUNNING';
  AgentStatus['STOPPED'] = 'STOPPED';
  AgentStatus['ERROR'] = 'ERROR';
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
var CampaignType;
(function (CampaignType) {
  CampaignType['CONTENT_MARKETING'] = 'CONTENT_MARKETING';
  CampaignType['EMAIL_MARKETING'] = 'EMAIL_MARKETING';
  CampaignType['SOCIAL_MEDIA'] = 'SOCIAL_MEDIA';
  CampaignType['SEO'] = 'SEO';
  CampaignType['PAID_ADVERTISING'] = 'PAID_ADVERTISING';
})(CampaignType || (exports.CampaignType = CampaignType = {}));
var CampaignStatus;
(function (CampaignStatus) {
  CampaignStatus['DRAFT'] = 'DRAFT';
  CampaignStatus['ACTIVE'] = 'ACTIVE';
  CampaignStatus['PAUSED'] = 'PAUSED';
  CampaignStatus['COMPLETED'] = 'COMPLETED';
  CampaignStatus['FAILED'] = 'FAILED';
})(CampaignStatus || (exports.CampaignStatus = CampaignStatus = {}));
