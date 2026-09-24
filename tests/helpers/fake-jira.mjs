// In-memory stand-in for the Jira/JSM REST endpoints Portal+ calls with
// asApp(). Search applies JSM customer visibility semantics to the JQL Portal+
// generates, and rejects any JQL outside the exact expected grammar so an
// injected clause fails loudly instead of being silently ignored.

const QUOTED = '"((?:\\\\.|[^"\\\\])*)"';
const unescape = (text) => text.replace(/\\(.)/g, '$1');
const JQL = new RegExp(
  `^project = (\\d+) AND \\(reporter = ${QUOTED}(?: OR organizations in \\(((?:${QUOTED.replace('(', '(?:')},?)+)\\))?\\)(?: AND key = ${QUOTED})? ORDER BY created DESC$`
);

export function parseCustomerJql(jql) {
  const match = JQL.exec(jql);
  if (!match) throw new Error(`Unexpected JQL shape: ${jql}`);
  const [, projectId, reporter, orgList, key] = match;
  const orgs = orgList ? [...orgList.matchAll(new RegExp(QUOTED, 'g'))].map((m) => unescape(m[1])) : [];
  return { projectId, reporter: unescape(reporter), orgs, key: key ? unescape(key) : '' };
}

const json = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
  text: async () => (body === undefined ? '' : JSON.stringify(body))
});

export function createFakeJira({ issues = [], memberships = {}, organizations = [], transitions = {}, discovery = null } = {}) {
  const calls = [];
  const orgName = (id) => organizations.find((org) => org.id === id)?.name;

  function visibleTo(query) {
    return issues
      .filter((issue) => issue.projectId === query.projectId)
      .filter((issue) => issue.reporter === query.reporter || issue.orgIds.some((id) => query.orgs.includes(orgName(id))))
      .filter((issue) => !query.key || issue.key === query.key)
      .sort((a, b) => b.created.localeCompare(a.created));
  }

  function toIssue(issue) {
    return {
      key: issue.key,
      fields: {
        summary: issue.summary,
        status: { id: issue.statusId, name: issue.statusName },
        created: issue.created,
        updated: issue.created,
        resolutiondate: null,
        reporter: { accountId: issue.reporter, displayName: issue.reporterName || issue.reporter },
        ...(issue.fields || {})
      },
      properties: {}
    };
  }

  async function requestJira(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body) : undefined;
    const url = new URL(String(path), 'https://jira.test');
    calls.push({ method, path: url.pathname, query: Object.fromEntries(url.searchParams), body });

    if (method === 'GET' && url.pathname === '/rest/servicedeskapi/organization') {
      const ids = memberships[url.searchParams.get('accountId')] || [];
      return json(200, { values: organizations.filter((org) => ids.includes(org.id)) });
    }
    if (method === 'POST' && url.pathname === '/rest/api/3/search/jql') {
      const all = visibleTo(parseCustomerJql(body.jql));
      const start = body.nextPageToken ? Number(body.nextPageToken) : 0;
      const page = all.slice(start, start + body.maxResults);
      const next = start + page.length < all.length ? String(start + page.length) : undefined;
      return json(200, { issues: page.map(toIssue), nextPageToken: next, isLast: !next });
    }
    if (url.pathname.startsWith('/rest/api/3/project/') && url.pathname.includes('/properties/')) return json(404, { errorMessages: ['not found'] });

    // Admin discovery: { serviceDesk, requestTypes, fieldsByRequestType, statuses }
    if (discovery && method === 'GET') {
      if (url.pathname === '/rest/servicedeskapi/servicedesk') return json(200, { values: [discovery.serviceDesk] });
      if (/^\/rest\/servicedeskapi\/servicedesk\/[^/]+\/requesttype$/.test(url.pathname)) return json(200, { values: discovery.requestTypes });
      const typeFields = /^\/rest\/servicedeskapi\/servicedesk\/[^/]+\/requesttype\/([^/]+)\/field$/.exec(url.pathname);
      if (typeFields) return json(200, { requestTypeFields: discovery.fieldsByRequestType[typeFields[1]] || [] });
      if (/^\/rest\/servicedeskapi\/servicedesk\/[^/]+\/organization$/.test(url.pathname)) return json(200, { values: organizations });
      if (/^\/rest\/api\/3\/project\/[^/]+\/statuses$/.test(url.pathname)) return json(200, [{ statuses: discovery.statuses }]);
    }

    const transitionPath = /^\/rest\/api\/3\/issue\/([^/]+)\/transitions$/.exec(url.pathname);
    if (transitionPath && method === 'GET') return json(200, { transitions: transitions[transitionPath[1]] || [] });
    if (transitionPath && method === 'POST') return json(204);
    if (/^\/rest\/api\/3\/issue\/[^/]+\/comment$/.test(url.pathname) && method === 'POST') return json(201, { id: '1' });
    if (/^\/rest\/api\/3\/issue\/[^/]+$/.test(url.pathname) && method === 'PUT') return json(204);
    if (/^\/rest\/servicedeskapi\/request\/[^/]+\/sla$/.test(url.pathname)) return json(200, { values: [] });

    return json(404, { errorMessages: [`fake-jira: no route for ${method} ${url.pathname}`] });
  }

  return { requestJira, calls, writes: () => calls.filter((call) => call.method !== 'GET' && call.path !== '/rest/api/3/search/jql') };
}

// Mirrors @forge/api's route tag closely enough for path construction.
export function route(strings, ...values) {
  return strings.reduce((out, text, index) => {
    if (index >= values.length) return out + text;
    const value = values[index];
    return out + text + (value instanceof URLSearchParams ? value.toString() : encodeURIComponent(String(value)));
  }, '');
}
