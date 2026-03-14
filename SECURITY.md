# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of AccordJS seriously. If you discover a security vulnerability, we appreciate your help in disclosing it to us in a responsible manner.

### Private Vulnerability Reporting

GitHub's private vulnerability reporting is enabled for this repository. This is the preferred method for reporting security issues.

**To report a vulnerability:**

1. Go to the [Security tab](https://github.com/AccordJS/accordjs/security) of this repository
2. Click "Report a vulnerability"
3. Fill out the vulnerability report form with:
   - A description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact
   - Any suggested fixes (if you have them)

### What to Expect

- **Acknowledgment**: We will acknowledge receipt of your vulnerability report within 48 hours
- **Initial Response**: We will provide an initial response within 5 business days
- **Progress Updates**: We will keep you informed of our progress throughout the process
- **Resolution**: We aim to resolve critical vulnerabilities within 90 days

### Security Best Practices for AccordJS

When using AccordJS in production:

1. **Environment Variables**: Store Discord bot tokens and other sensitive data in environment variables
2. **Input Validation**: Always validate user input in command handlers
3. **Permission Checks**: Implement proper permission checks for sensitive commands
4. **Rate Limiting**: Use Discord.js built-in rate limiting and implement additional rate limiting as needed
5. **Logging**: Monitor logs for suspicious activity but avoid logging sensitive information
6. **Updates**: Keep AccordJS and all dependencies up to date

### Scope

This security policy applies to:

- The core AccordJS framework
- Official plugins included in the repository
- Documentation and example code

### Out of Scope

- Third-party plugins not maintained by the AccordJS team
- Applications built using AccordJS (unless the vulnerability is in the framework itself)
- Social engineering attacks

### Disclosure Policy

- We will work with you to understand and resolve the issue
- We will acknowledge your responsible disclosure in our security advisories (unless you prefer to remain anonymous)
- We will not take legal action against security researchers who follow this policy

Thank you for helping keep AccordJS and our community safe!