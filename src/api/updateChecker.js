const axios = require('axios');
const { app } = require('electron');

class UpdateChecker {
  constructor() {
    this.currentVersion = app.getVersion();
    this.githubRepo = 'TrakeLean/Rift-Revealer'; // Update with your GitHub username/repo
  }

  /**
   * Convert markdown to plain text for display
   * @param {string} markdown - Markdown text
   * @returns {string} - Plain text
   */
  markdownToPlainText(markdown) {
    if (!markdown) return '';

    return markdown
      // Remove headers (###, ##, #)
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic (**text**, *text*, __text__, _text_)
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      // Remove links [text](url) -> text
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      // Remove bullet points (-, *, +)
      .replace(/^[\s]*[-*+]\s+/gm, '• ')
      // Remove code blocks (```)
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code (`code`)
      .replace(/`([^`]+)`/g, '$1')
      // Clean up extra newlines (max 2 consecutive)
      .replace(/\n{3,}/g, '\n\n')
      // Trim whitespace
      .trim();
  }

  /**
   * Check for updates from GitHub releases
   * @returns {Promise<{hasUpdate: boolean, latestVersion: string, downloadUrl: string, releaseNotes: string}>}
   */
  async checkForUpdates() {
    try {
      const response = await axios.get(
        `https://api.github.com/repos/${this.githubRepo}/releases/latest`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Rift-Revealer-App'
          },
          timeout: 10000
        }
      );

      const latestRelease = response.data;
      const latestVersion = latestRelease.tag_name.replace(/^v/, ''); // Remove 'v' prefix if present
      const currentVersion = this.currentVersion;

      console.log('Current version:', currentVersion);
      console.log('Latest version:', latestVersion);

      const hasUpdate = this.compareVersions(latestVersion, currentVersion) > 0;

      // Find the Windows Setup installer download URL
      let downloadUrl = latestRelease.html_url; // Default to release page
      const windowsAsset = latestRelease.assets?.find(asset =>
        asset.name.includes('Setup') && asset.name.endsWith('.exe')
      );

      if (windowsAsset) {
        downloadUrl = windowsAsset.browser_download_url;
      }

      return {
        hasUpdate,
        latestVersion,
        currentVersion,
        downloadUrl,
        releaseNotes: this.markdownToPlainText(latestRelease.body) || 'No release notes available.',
        releaseName: latestRelease.name || `Version ${latestVersion}`
      };
    } catch (error) {
      console.error('Error checking for updates:', error.message);
      throw new Error(`Failed to check for updates: ${error.message}`);
    }
  }

  /**
   * Compare two semantic versions
   * @param {string} v1 - First version
   * @param {string} v2 - Second version
   * @returns {number} - Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
   */
  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }

    return 0;
  }
}

module.exports = UpdateChecker;
