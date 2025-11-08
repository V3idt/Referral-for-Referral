# Contributing to Referral-for-Referral

Thank you for your interest in contributing! 🎉

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](../../issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Your environment (OS, browser, Node version)

### Suggesting Features

1. Check [Issues](../../issues) for existing feature requests
2. Create a new issue with:
   - Clear description of the feature
   - Use case / why it's needed
   - Possible implementation ideas

### Pull Requests

1. **Fork the repository**
2. **Create a branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages**: 
   - Use present tense ("Add feature" not "Added feature")
   - Reference issues if applicable
6. **Push to your fork**
7. **Open a Pull Request**

### Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/base44-nextjs.git
cd base44-nextjs

# Install dependencies
npm install

# Set up Supabase (see SUPABASE_SETUP.md)
cp .env.example .env.local
# Add your Supabase credentials

# Run development server
npm run dev
```

### Code Style

- Use TypeScript for new code
- Follow existing code style
- Run `npm run lint` before committing
- Add comments for complex logic

### Testing

Before submitting:
- [ ] Test all features work
- [ ] Check console for errors
- [ ] Test on mobile/tablet if UI changes
- [ ] Verify dark mode works

### Commit Message Guidelines

**Format**: `type: description`

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples**:
```
feat: add email notifications
fix: resolve hydration error in sidebar
docs: update Supabase setup guide
refactor: simplify message filtering logic
```

### Pull Request Checklist

- [ ] Code follows project style
- [ ] Tested locally
- [ ] No console errors
- [ ] Updated documentation if needed
- [ ] Commit messages are clear
- [ ] Branch is up to date with main

### Need Help?

- Check existing [Issues](../../issues) and [Discussions](../../discussions)
- Read the [README](README.md) and [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- Ask in a new discussion or issue

## Code of Conduct

Be respectful, inclusive, and constructive. We want this to be a welcoming community for everyone.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing!** 🚀

