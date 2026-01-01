// Swagger-like CSS styles
export const swaggerStyles = `
  * {
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    padding: 0;
    background: #fafafa;
    color: #3b4151;
    line-height: 1.5;
  }

  .swagger-ui {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  /* API Info Header */
  .api-info {
    background: #1b1b1b;
    color: white;
    padding: 2rem;
    border-radius: 8px;
    margin-bottom: 2rem;
  }

  .api-info h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
  }

  .api-info .version {
    background: #49cc90;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .api-info .description {
    margin-top: 1rem;
    opacity: 0.8;
  }

  /* Tag Groups */
  .tag-group {
    background: white;
    border: 1px solid #d8dce1;
    border-radius: 4px;
    margin-bottom: 1rem;
  }

  .tag-header {
    display: flex;
    align-items: center;
    padding: 1rem;
    cursor: pointer;
    background: #f7f7f7;
    border-bottom: 1px solid #d8dce1;
    list-style: none;
  }

  .tag-header::-webkit-details-marker {
    display: none;
  }

  .tag-header::before {
    content: '▶';
    margin-right: 0.5rem;
    font-size: 0.75rem;
    transition: transform 0.2s;
  }

  details[open] > .tag-header::before {
    transform: rotate(90deg);
  }

  .tag-header:hover {
    background: #ebebeb;
  }

  .tag-header h2 {
    margin: 0;
    font-size: 1.25rem;
    flex: 1;
  }

  .tag-header .count {
    font-size: 0.875rem;
    color: #6b6b6b;
  }

  .tag-content {
    padding: 0.5rem;
  }

  /* Endpoints */
  .endpoint {
    border: 1px solid #d8dce1;
    border-radius: 4px;
    margin: 0.5rem 0;
    overflow: hidden;
  }

  .endpoint-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    cursor: pointer;
    border-left: 4px solid;
    list-style: none;
  }

  .endpoint-header::-webkit-details-marker {
    display: none;
  }

  .endpoint-header:hover {
    filter: brightness(0.97);
  }

  /* Method colors */
  .method-get { border-left-color: #49cc90; background: rgba(73, 204, 144, 0.1); }
  .method-post { border-left-color: #49a0d8; background: rgba(73, 160, 216, 0.1); }
  .method-put { border-left-color: #fca130; background: rgba(252, 161, 48, 0.1); }
  .method-delete { border-left-color: #f93e3e; background: rgba(249, 62, 62, 0.1); }
  .method-patch { border-left-color: #50e3c2; background: rgba(80, 227, 194, 0.1); }

  .method-badge {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.25rem 0.5rem;
    border-radius: 3px;
    color: white;
    min-width: 60px;
    text-align: center;
    text-transform: uppercase;
  }

  .method-badge.get { background: #49cc90; }
  .method-badge.post { background: #49a0d8; }
  .method-badge.put { background: #fca130; }
  .method-badge.delete { background: #f93e3e; }
  .method-badge.patch { background: #50e3c2; }

  .endpoint-header .path {
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .endpoint-header .summary {
    color: #6b6b6b;
    font-size: 0.875rem;
    flex: 1;
    text-align: right;
  }

  .endpoint-content {
    padding: 1rem;
    border-top: 1px solid #d8dce1;
    background: white;
  }

  .endpoint-content h4 {
    font-size: 0.875rem;
    text-transform: uppercase;
    color: #6b6b6b;
    margin: 1.5rem 0 0.5rem 0;
    letter-spacing: 0.5px;
  }

  .endpoint-content h4:first-child {
    margin-top: 0;
  }

  .endpoint-content .description {
    margin: 0 0 1rem 0;
    color: #3b4151;
  }

  /* Parameters table */
  .parameters table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .parameters th,
  .parameters td {
    text-align: left;
    padding: 0.5rem;
    border-bottom: 1px solid #eee;
  }

  .parameters th {
    background: #f7f7f7;
    font-weight: 600;
  }

  .param-name {
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    font-weight: 600;
  }

  .param-required {
    color: #f93e3e;
    font-size: 0.75rem;
  }

  /* Response status codes */
  .responses .response {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin: 0.5rem 0;
    padding: 0.75rem;
    background: #f7f7f7;
    border-radius: 4px;
  }

  .status-code {
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    font-weight: 700;
    padding: 0.25rem 0.5rem;
    border-radius: 3px;
    font-size: 0.875rem;
  }

  .status-2xx { background: #49cc90; color: white; }
  .status-3xx { background: #fca130; color: white; }
  .status-4xx { background: #f93e3e; color: white; }
  .status-5xx { background: #6c757d; color: white; }

  .response-desc {
    flex: 1;
  }

  /* Schema display */
  .schema-view {
    background: #2d2d2d;
    color: #f8f8f2;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.8rem;
    margin: 0.5rem 0;
  }

  .schema-view code {
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    white-space: pre;
  }

  /* Request body */
  .request-body .content-type {
    font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
    font-size: 0.75rem;
    color: #6b6b6b;
    margin-bottom: 0.5rem;
  }
`
