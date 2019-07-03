# Flask URLs in JS - the clean way!

I should really write something nicer here. Later. Or maybe you want to send a PR?
For now, check out the `example` and `react-example` folder for small example apps
showing how to use this. The `react-example` uses the Babel macro which can be used
with an unejected `create-react-app` setup.

## Releases

As a user of library, you can safely ignore this section. This is just for maintainers to know how to make releases.

### JavaScript releases

- `npm run check` to ensure everything is fine (tests + eslint)
- `npx lerna publish` to publish a new version (choose a version according to semver!)
- `git push` the new commit and tags to the upstream repo (not your fork!)

### Python releases

- `pytest` to ensure the tests pass
- Bump the version in `setup.py` manually (according to semver)
- `python setup.py bdist_wheel` to build the wheel
- `git tag -s flask-cli@x.y.z` to tag the release (with x.y.z being the new version)
- `twine upload ...` to publish the wheel
- `git push` the new commit and tags to the upstream repo (not your fork!)
