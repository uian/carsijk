import { TraceStep, RequestLog } from './types';

// Mock SP Entity IDs (常见数据库商)
export const SP_ENTITY_IDS = [
  'CNKI (知网)',
  'Elsevier (ScienceDirect)',
  'IEEE Xplore',
  'Web of Science',
  'Zoom Video',
  'Tsinghua University (IPv6)',
  'Springer Nature'
];

// Mock realistic User IDs
export const MOCK_USERS = [
  '2021001045 (学生)', '2022003102 (学生)', 'js_lihua (教师)', 'mz_zhang (行政)', 'sys_admin', 'lib_guest'
];

const generateId = () => Math.random().toString(36).substring(2, 10).toUpperCase();

export const generateMockRequest = (): RequestLog => {
  const isError = Math.random() > 0.85; // 15% chance of error
  const sp = SP_ENTITY_IDS[Math.floor(Math.random() * SP_ENTITY_IDS.length)];
  const user = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
  const userOnly = user.split(' ')[0];
  const txId = `REQ-` + generateId();
  const startTime = new Date();
  
  // 模拟真实服务器日志格式
  // 自动获取当前域名，如果没有则使用默认值
  let serverHost = "idp.yzu.edu.cn";
  try {
     if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
        serverHost = window.location.hostname;
     }
  } catch(e) {}

  const logPrefix = `[${startTime.toISOString()}] [${serverHost}]`;
  
  // Steps with "Life Metaphors"
  const steps: TraceStep[] = [
    {
      id: '1',
      name: '客人敲门 (收到请求)',
      status: 'success',
      timestamp: new Date(startTime.getTime() + 10).toISOString(),
      details: `接口 eth0 收到来自 ${sp} 的 SAML2 Redirect 访问申请。`,
      durationMs: 10
    },
    {
      id: '2',
      name: '前台拆信 (解析数据)',
      status: 'success',
      timestamp: new Date(startTime.getTime() + 20).toISOString(),
      details: 'Jetty (Port 8443) 容器成功解析 XML 消息，SAML 签名有效。',
      durationMs: 5
    },
    {
      id: '3',
      name: '保卫处查证 (身份核实)',
      status: isError && Math.random() > 0.5 ? 'failure' : 'success',
      timestamp: new Date(startTime.getTime() + 150).toISOString(),
      details: `通过内网连接 LDAP 服务器核对账号 ${userOnly} ...`,
      durationMs: 130
    },
    {
      id: '4',
      name: '档案室调档 (获取属性)',
      status: isError && Math.random() > 0.5 ? 'failure' : 'success',
      timestamp: new Date(startTime.getTime() + 250).toISOString(),
      details: '从 ou=People,dc=yzu,dc=edu,dc=cn 查询用户详细属性。',
      durationMs: 100
    },
    {
      id: '5',
      name: '开具通行证 (隐私过滤)',
      status: 'success',
      timestamp: new Date(startTime.getTime() + 260).toISOString(),
      details: `应用 attribute-filter.xml 规则，释放 'eduPersonScopedAffiliation'。`,
      durationMs: 10
    },
    {
      id: '6',
      name: '盖章放行 (加密回复)',
      status: isError ? 'failure' : 'success',
      timestamp: new Date(startTime.getTime() + 280).toISOString(),
      details: '调用 idp-signing.crt 对响应进行数字签名，返回 200 OK。',
      durationMs: 20
    }
  ];

  // Logic to simulate cascade failure
  let failed = false;
  steps.forEach(step => {
    if (failed) {
        step.status = 'pending'; 
        step.details = '由于前序步骤失败，此步骤已取消。';
        step.name = step.name.split(' ')[0] + ' (已取消)';
    }
    if (step.status === 'failure') {
        failed = true;
        if (step.name.includes('保卫处')) step.details = '密码错误或账号被锁定 (LDAP Error 49)。';
        if (step.name.includes('档案室')) step.details = 'LDAP 连接超时 (Timeout 3000ms)，无法读取属性。';
        if (step.name.includes('盖章')) step.details = '签名证书过期或配置错误。';
    }
  });

  const totalDuration = steps.reduce((acc, s) => acc + s.durationMs, 0);

  // Generate a mock Audit Log entry (Pipe delimited standard format)
  // Format: timestamp|binding|requestId|peer|profile|principal|authn|attributes
  const auditLogEntry = `${startTime.toISOString().replace('T',' ')}|urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect|${txId}|${sp}|http://shibboleth.net/ns/profiles/saml2/sso/browser|${failed ? '' : userOnly}|Password|${failed ? '' : 'eduPersonScopedAffiliation,mail,cn'}`;

  return {
    id: txId,
    timestamp: startTime,
    spEntityId: sp,
    userPrincipal: failed && steps[2].status === 'failure' ? '未知用户' : user,
    status: failed ? 'FAILURE' : 'SUCCESS',
    durationMs: totalDuration,
    steps: steps,
    // process.log = 叙事性日志 (Narrative)
    rawLogs: [
        `${logPrefix} INFO [net.shibboleth.idp.authn]: Request received from ${sp}`,
        `${logPrefix} DEBUG [net.shibboleth.idp.profile]: Transaction ${txId} started on ${serverHost}`,
        failed ? `${logPrefix} WARN [net.shibboleth.idp.authn]: Authentication failure for ${userOnly}` : `${logPrefix} INFO [net.shibboleth.idp.authn]: Authentication success for ${userOnly}`,
        failed ? `${logPrefix} ERROR [net.shibboleth.idp.profile]: Flow execution halted` : `${logPrefix} INFO [net.shibboleth.idp.consent]: Attribute release: ${userOnly} -> ${sp}`
    ],
    // audit.log = 结构化数据 (Structured Data)
    auditLog: auditLogEntry
  };
};