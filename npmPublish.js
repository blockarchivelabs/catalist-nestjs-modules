const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packagesDir = './packages';
const packageFolders = fs.readdirSync(packagesDir);

const excludePackage = [];

packageFolders.forEach((packageFolder) => {
  const packagePath = path.join(packagesDir, packageFolder);

  if (excludePackage.includes(packagePath.split('/')[1])) return;

  const packageJsonPath = path.join(packagePath, 'package.json');

  if (fs.existsSync(packageJsonPath)) {
    const packageJson = require('./' + packageJsonPath);
    const packageName = packageJson.name;
    let currentVersion = packageJson.version;

    // Get the current version from npm
    const currentPublishedVersion = execSync(`npm show ${packageName} version`)
      .toString()
      .trim();

    if (currentPublishedVersion !== currentVersion) {
      console.log(
        `${packageName} is already at version ${currentPublishedVersion}.`,
      );
      currentVersion = currentPublishedVersion;
    }

    const versionParts = currentVersion.split('.');
    const newVersion = `${versionParts[0]}.${versionParts[1]}.${
      parseInt(versionParts[2]) + 1
    }`;

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
