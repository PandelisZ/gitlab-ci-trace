# gitlab-ci-trace
[![npm version](https://badge.fury.io/js/gitlab-ci-trace.svg)](https://www.npmjs.com/package/gitlab-ci-trace)

Output the results of CI job traces into the console that has pushed the commit.
This mimics the behaviour users of Heroku are used to where by a push to heroku will
trigger a build and the build status appears as part of the push status.


## Features

- Support for gitlab.com or custom deployments
- Auto detects the GitLab host based on the ssh or https git url
- Trace multiple simultaneous jobs
- Auto detect the correct running jobs based on the HEAD commit hash

## Usage

```sh
npm install -g gitlab-ci-trace
```

You'll also need to set an enviroment variable in your bash enviroment so that we can make API requests to GitLab.

The token will need access to the API scope


```bash
# ~/.bashrc
export GITLAB_TOKEN='IMATOKENWEEE'
```


Unfortunately there is no functionality within git itself for a post push hook which
is what we would like to hook onto. Instead we need to use a git alias.

You can choose to name the alias whatever you want. I chose `git pusht` for push and trace.


```bash
# ~/.gitconfig
[alias]
	pusht = !"git push $* && gitlab-ci-trace"
```

or

```sh
git config --global alias.pusht '!git push $* && gitlab-ci-trace'
```

You can also choose to just call the command directly after a push when you need
to check on the status of a build.
