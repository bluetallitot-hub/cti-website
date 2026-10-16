/* CTI repository configuration: update only after the synagogue-owned repository exists. */
const CTI_REPO = {
  repository: 'bluetallitot-hub/cti-website', // current temporary home
  branch: 'main'
};
CTI_REPO.web = 'https://github.com/' + CTI_REPO.repository;
document.querySelectorAll('a[data-repo-path]').forEach(link => {
  const suffix = link.getAttribute('data-repo-path');
  link.href = CTI_REPO.web + (suffix ? '/' + suffix : '');
});
