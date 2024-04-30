const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packagesDir = './packages';
const packageFolders = fs.readdirSync(packagesDir);

const includePackage = ['constants'];

packageFolders.forEach((packageFolder) => {
  const packagePath = path.join(packagesDir, packageFolder);

  if (!includePackage.includes(packagePath.split('/')[1])) return;

  const packageJsonPath = path.join(packagePath, 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = require('./' + packageJsonPath);
    const packageName = packageJson.name;
    let currentVersion = packageJson.version;

    // Get the current version from npm
    const currentPublishedVersion = execSync(`npm show ${packageName} version`)
      .toString()
      .trim();

    const currentPublishedVersionParts = currentPublishedVersion.split('.');
    const versionParts = currentVersion.split('.');
    let newVersion = '';
    currentVersion = currentPublishedVersion;

    if (
      +currentPublishedVersionParts[0] < +versionParts[0] ||
      +currentPublishedVersionParts[1] < +versionParts[1] ||
      +currentPublishedVersionParts[2] < +versionParts[1]
    ) {
      newVersion = `${versionParts[0]}.${versionParts[1]}.${+versionParts[2]}`;
    } else {
      console.log(
        `${packageName} is already at version ${currentPublishedVersion}.`,
      );
      newVersion = `${currentPublishedVersionParts[0]}.${
        currentPublishedVersionParts[1]
      }.${parseInt(currentPublishedVersionParts[2]) + 1}`;
    }

    packageJson.version = newVersion;

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    try {
      const publishCommand = `npm publish`;

      // Execute the npm publish command
      execSync(publishCommand, { cwd: './' + packagePath, stdio: 'inherit' });
      console.log(
        `Publishing ${packageName}@${packageJson.version} in ${packagePath}`,
      );
    } catch (error) {
      console.log(error);
      console.error(
        `Failed to publish ${packageName}@${packageJson.version} in ${packagePath}`,
      );
      packageJson.version = currentVersion;
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }
  }
});
