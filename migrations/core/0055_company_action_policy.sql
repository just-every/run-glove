-- Installation policy is deliberately outside business archives and credentials.
-- Reconnection to another company cannot inherit an earlier company's authority.
CREATE TABLE glove_company_action_policy (
  company_id TEXT NOT NULL,
  connection_id TEXT NOT NULL,
  risk_class TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('allow', 'review', 'approve', 'block')),
  PRIMARY KEY (company_id, connection_id, risk_class)
);
