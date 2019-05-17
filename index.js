#!/usr/bin/env node
const git = require('simple-git/promise')(process.cwd())
const Gitlab = require('gitlab/dist/es5').default
const Spinner = require('cli-spinner').Spinner
const sleep = require('util').promisify(setTimeout)
const axios = require('axios')
const chalk = require('chalk');
const log = console.log;

const REGEX = /([a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,})[\/:]([a-zA-Z0-9-/]+).git/
const RUNNING_JOBS = ['running', 'pending', 'created']

const getUrlAndProject = (remote) => {
    const matches = REGEX.exec(remote)
    if (!matches || matches.length !== 3) {
        throw Error('Could not extract url and remote project name from origin', remote)
    }

    return {
        url: matches[1],
        project: matches[2] // encoded to be passed to the gitlab api
    }

}

class Project {

    async init() {
        const remotes = await git.getRemotes(true)
        const origin = remotes.find(r => r.name === 'origin')
        const {url, project} = getUrlAndProject(origin.refs.push)
        let HEAD = await git.raw(['rev-parse', 'HEAD'])
        HEAD = HEAD.trim()

        this.head = HEAD
        this.url = url
        this.project = project
        // Instantiating
        this.api = new Gitlab({
            url:   `https://${url}`,
            token: process.env.GITLAB_TOKEN || process.env.GL_TOKEN
        })
    }

    async jobsForHead() {
        const spinner = new Spinner('%s Fetching jobs for: ' + chalk.green(this.project))
        spinner.setSpinnerString('|/-\\')
        spinner.start()
        const jobs = await this.api.Jobs.all(this.project, {scope: RUNNING_JOBS})
        Promise.all([jobs]).then(() => {
            spinner.stop(true)

        })
        const jobsForCommit = jobs.filter(j => j.commit.id === this.head)
        return await jobsForCommit
    }

    async jobIsRunning(jobId) {

        const job = await this.api.Jobs.show(this.project, jobId)
        const isRunning = RUNNING_JOBS.includes(job.status)

        return await isRunning
    }

    async trace(jobId) {
        const response = await axios({
            url: `https://${this.url}/api/v4/projects/${encodeURIComponent(this.project)}/jobs/${jobId}/trace`,
            method: 'GET',
            headers: { 'PRIVATE-TOKEN': process.env.GITLAB_TOKEN || process.env.GL_TOKEN }
        })
        return await response.data
    }
}


async function main() {
    project = new Project()
    await project.init()
    const jobs = await project.jobsForHead()

    if (jobs.length === 0) {
        log(chalk.red('No active jobs found'))
        return process.exit(1)
    }

    let traced = {}
    let finishedJobs = {}

    log('Processing job: ' + jobs.map(j => j.id))

    while(Object.keys(finishedJobs).length < jobs.length) {
        jobs.forEach(async (j) => {
            let newTrace = await project.trace(j.id)
            if (traced[j.id]) {
                let newOutput = newTrace.replace(traced[j.id], '')
                if (newOutput) {
                    process.stdout.write(newOutput)
                }
            } else if (newTrace) {
                process.stdout.write(newTrace)
            }
            traced[j.id] = newTrace
            const running = await project.jobIsRunning(j.id)
            if (running === false) {
                finishedJobs[j.id] = true
            }
        })

        await sleep(2000)
    }
}
main()

