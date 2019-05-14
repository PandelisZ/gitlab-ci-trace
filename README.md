# gitlab-ci-trace

Output the results of CI job traces into the console that has pushed the commit.
This mimics the behaviour users of Heroku are used to where by a push to heroku will
trigger a build and the build status appears as part of the push status.


## Usage

```sh
npm install -g gitlab-ci-trace
```

Unfortunately there is no functionality within git itself for a post push hook which
is what we would like to hook onto. Instead we need to use a git alias.

You can choose to name the alias whatever you want. I chose `git pusht` for push and trace.

~/.gitconfig
```bash
[alias]
	pusht = !"git push $* && gitlab-ci-trace"
```

or

```sh
$ git config --global alias.pusht '!git push $* && gitlab-ci-trace'
```
