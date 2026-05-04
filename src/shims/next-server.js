function serializeCookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value ?? '')}`];

  if (typeof options.maxAge === 'number') {
    parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  }
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.expires) {
    const expires = options.expires instanceof Date
      ? options.expires.toUTCString()
      : new Date(options.expires).toUTCString();
    parts.push(`Expires=${expires}`);
  }
  if (options.httpOnly) parts.push('HttpOnly');
  if (options.secure) parts.push('Secure');
  if (options.sameSite) {
    const sameSite = String(options.sameSite).toLowerCase();
    if (sameSite === 'lax') parts.push('SameSite=Lax');
    else if (sameSite === 'strict') parts.push('SameSite=Strict');
    else if (sameSite === 'none') parts.push('SameSite=None');
  }

  return parts.join('; ');
}

export class NextResponse extends Response {
  constructor(body, init) {
    super(body, init);
    this.cookies = {
      set: (name, value, options = {}) => {
        this.headers.append('Set-Cookie', serializeCookie(name, value, options));
      },
    };
  }

  static json(data, init = {}) {
    const headers = new Headers(init.headers || {});
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json; charset=utf-8');
    }
    return new NextResponse(JSON.stringify(data), {
      ...init,
      headers,
      status: init.status ?? 200,
    });
  }
}
