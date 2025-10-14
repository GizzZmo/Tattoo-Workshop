# Contributing to Tattoo Workshop

Thank you for considering contributing to Tattoo Workshop! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Respect differing viewpoints and experiences

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the behavior
- **Expected behavior**
- **Actual behavior**
- **Screenshots** if applicable
- **Environment details** (OS, Node version, browser)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description**
- **Use case** explaining why this enhancement would be useful
- **Possible implementation** approach
- **Alternatives** you've considered

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following the coding standards
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Write meaningful commit messages**
6. **Submit a pull request**

## Development Setup

1. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Tattoo-Workshop.git
   cd Tattoo-Workshop
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Coding Standards

### JavaScript/React

- Use **ES6+** features
- Follow **React best practices**
- Use **functional components** with hooks
- Keep components **small and focused**
- Use **meaningful variable names**

### Code Style

- Run ESLint before committing:
  ```bash
  npm run lint
  ```

- Format code consistently
- Add comments for complex logic
- Keep functions small and single-purpose

### Commit Messages

Use clear and meaningful commit messages:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

Examples:
```
feat: Add email notifications for appointments
fix: Resolve customer deletion bug
docs: Update API documentation
```

### File Organization

- Place React components in `src/pages/` or `src/components/`
- Keep styles in `src/styles/`
- Server code goes in `server/`
- Update documentation in the root directory

## Testing

- Test all new features manually
- Test on different browsers (Chrome, Firefox, Safari, Edge)
- Test responsive design on mobile devices
- Verify database operations work correctly

## Documentation

Update relevant documentation when making changes:

- **README.md** - General information
- **API.md** - API endpoint changes
- **INSTALLATION.md** - Installation process changes
- Code comments for complex logic

## Pull Request Process

1. Ensure your code follows the coding standards
2. Update documentation as needed
3. Test your changes thoroughly
4. Make sure the build passes: `npm run build`
5. Create a pull request with:
   - Clear title and description
   - Reference to related issues
   - Screenshots for UI changes
   - List of changes made

## Feature Requests

We welcome feature requests! When submitting:

1. Check if the feature already exists or is planned
2. Clearly describe the feature and its benefits
3. Provide use cases
4. Consider implementation complexity

## Questions?

Feel free to:
- Open an issue for questions
- Ask for clarification on existing issues
- Discuss implementation approaches

## Areas for Contribution

Looking for ways to contribute? Consider:

- **Bug fixes** - Check open issues
- **Documentation** - Improve or expand docs
- **UI/UX improvements** - Enhance the interface
- **Performance** - Optimize code
- **Testing** - Add tests
- **Accessibility** - Improve a11y
- **Internationalization** - Add translations
- **New features** - From the roadmap or your ideas

## Recognition

Contributors will be:
- Listed in the project
- Acknowledged in release notes
- Part of the project's history

Thank you for contributing to Tattoo Workshop! 🎨
