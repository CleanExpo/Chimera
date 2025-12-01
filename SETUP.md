# 🔐 Secure API Key Setup Guide

This guide explains how to securely manage API keys and sensitive credentials for the Claude Code Agent Orchestration System.

## 📋 Quick Start

```bash
# 1. Copy the environment template
cp .env.example .env.local

# 2. Edit with your API keys
# Open .env.local in your editor and add your keys

# 3. Verify .gitignore (already configured)
# .env.local is automatically excluded from version control
```

## 🔑 Required API Keys

### EXA API Key (Required for Web Search)

**What it's for:** Enables the EXA MCP server to perform web searches and deep research.

**How to get it:**
1. Visit [https://exa.ai/](https://exa.ai/)
2. Sign up for an account
3. Navigate to API settings
4. Generate a new API key
5. Copy the key and add it to `.env.local`:
   ```bash
   EXA_API_KEY=your-actual-exa-api-key-here
   ```

### REF API Key (Required for Reference Tools)

**What it's for:** Enables the REF MCP server to access reference tools and documentation.

**How to get it:**
1. Visit [https://ref.tools/](https://ref.tools/)
2. Sign up for an account
3. Navigate to API settings
4. Generate a new API key
5. Copy the key and add it to `.env.local`:
   ```bash
   REF_API_KEY=your-actual-ref-api-key-here
   ```

## 🛡️ Security Best Practices

### File Security

✅ **DO:**
- Keep `.env.local` on your local machine only
- Use different API keys for development and production
- Regenerate keys if accidentally exposed
- Use `.env.example` as a template (no real keys)

❌ **DON'T:**
- Commit `.env.local` to version control
- Share your `.env.local` file
- Use production keys in development
- Hardcode API keys in your code

### .gitignore Protection

The following files are automatically excluded from git:
```
.env
.env.local
.env.*.local
*.key
*.pem
```

### Verification

Check that your `.env.local` is protected:
```bash
# This should show .env.local in the ignored files
git status --ignored
```

## 📦 Environment File Structure

### `.env.example` (Template - Safe to commit)
Contains placeholder values showing what keys are needed:
```bash
EXA_API_KEY=your-api-key-here
```

### `.env.local` (Your Keys - NEVER commit)
Contains your actual API keys:
```bash
EXA_API_KEY=1234567890abcdef...
```

## 🔧 MCP Server Configuration

The `.mcp.json` file references environment variables but doesn't store them:

```json
{
  "mcpServers": {
    "exa": {
      "command": "npx",
      "args": ["-y", "exa-mcp-server"],
      "env": {
        "EXA_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

**Note:** You'll need to manually update `.mcp.json` with your actual key or use environment variable loading.

## 🆕 Adding New API Keys

When adding new MCP servers that require API keys:

1. **Add to `.env.local`:**
   ```bash
   NEW_SERVICE_API_KEY=your-key-here
   ```

2. **Document in `.env.example`:**
   ```bash
   # New Service Configuration
   # Get your API key from: https://newservice.com
   NEW_SERVICE_API_KEY=your-api-key-here
   ```

3. **Update this guide** with instructions on how to obtain the key

## 🚨 Key Compromised?

If you accidentally expose an API key:

1. **Immediately revoke** the key at the provider's dashboard
2. **Generate a new key**
3. **Update `.env.local`** with the new key
4. **Check git history** - if committed, consider keys permanently compromised
5. **Rotate all keys** if stored in the same file

## ✅ Checklist

Before starting development:
- [ ] `.env.local` created from `.env.example`
- [ ] All required API keys added to `.env.local`
- [ ] `.env.local` is in `.gitignore`
- [ ] Verified `.env.local` not tracked by git (`git status`)
- [ ] Keys are not hardcoded anywhere in the codebase

## 📞 Support

Having issues with API key setup?
- Check [ISS AI Automation School](https://www.skool.com/iss-ai-automation-school-6342/about)
- Watch tutorials on [Income Stream Surfers YouTube](https://www.youtube.com/incomestreamsurfers)

## 🔗 Additional Resources

- [EXA API Documentation](https://docs.exa.ai/)
- [MCP Server Configuration](https://docs.modelcontextprotocol.io/)
- [Environment Variable Best Practices](https://12factor.net/config)

---

**Remember:** Security is not optional. Always protect your API keys! 🔒
