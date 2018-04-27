jQuery(($) => {
    const getProjectTags = post => _.filter(post.tags, { meta_title: 'project' });

    const updateStats = (singular, numItems) => {
        if (numItems) {
            const text = `${numItems} ${singular}${numItems > 1 ? 's' : ''}`;
            $('.author-stats').prepend(`${text} <span class="bull">&bull;</span>`);
        }
    };

    const loadData = async () => {
        const [, authorSlug] = /^\/author\/(.*?)\//.exec(window.location.pathname) || [];

        if (!authorSlug) return;

        const { posts } = await $.getJSON(ghost.url.api('posts', { include: 'authors,tags', limit: 'all' }));

        posts.forEach(post => {
            const text = $(post.html.replace(/<img .*?>/g, '')).text().trim();
            post.excerpt = text.split(/\s+/).slice(0, 33).join(' ');
            post.isProject = !!_.find(post.tags, { slug: 'projects' });
            post.hasProject = !!_.find(post.tags, { meta_title: 'project' });
            post.hasClient = !!_.find(post.tags, { meta_title: 'client' });
        });

        const tags = _.uniqBy(_.flatten(posts.map(post => post.tags)), 'id');

        const projects = _.remove(posts, 'isProject');
        const clients = _.filter(tags, { meta_title: 'client' });

        clients.push({ id: 0, name: 'No Client' });

        const byClient = new Map();

        const postsWithoutProject = posts.filter(post => !post.hasProject);
        const individualPosts = postsWithoutProject
            .filter(post => !post.hasClient && _.find(post.authors, { slug: authorSlug }));
        const postUrlsToKeep = _.groupBy(individualPosts, 'url');

        let numPosts = individualPosts.length;
        let numProjects = 0;
        let numClients = 0;


        clients.forEach(clientTag => {
            let clientProjects;
            if (clientTag.id) {
                const findClient = ({ tags }) => _.find(tags, { id: clientTag.id });
                clientProjects = [
                    ...projects.filter(findClient),
                    ...postsWithoutProject.filter(findClient),
                ];
            } else {
                const projectTags = _.countBy(_.flatten(projects.map(getProjectTags)), 'id');
                const hasProjectTag = post => getProjectTags(post).find(tag => projectTags[tag.id]);

                clientProjects = [
                    ...projects,
                    ...posts.filter(post => post.hasProject && !hasProjectTag(post)),
                ].filter(post => !post.hasClient);
            }

            const byProject = new Map();

            clientProjects.forEach(project => {
                const projectTags = project.isProject ? getProjectTags(project) : [];
                const tagIds = _.groupBy(projectTags, 'id');
                const projectPosts = posts
                    .filter(post => post.tags.find(tag => tagIds[tag.id]));

                const authors = _.flatten([
                    project.authors || [],
                    ...projectPosts.map(post => post.authors),
                ]);

                project.project_tag = projectTags[0];
                project.authors = _.uniqBy(authors, 'id');

                if (_.find(project.authors, { slug: authorSlug })) {
                    if (project.isProject) {
                        numProjects++;
                    } else {
                        numPosts++;
                    }

                    numPosts += projectPosts.length;
                    byProject.set(project, projectPosts);
                }
            });

            if (byProject.size) {
                if (clientTag.id) numClients++;
                byClient.set(clientTag, Array.from(byProject));
            }
        });

        $('.author-stats').html('');
        updateStats('post', numPosts);
        updateStats('project', numProjects);
        updateStats('client', numClients);

        const template = await $.get('/assets/html/authors.html', { bust: +new Date() });

        $('.post-card')
            .filter((idx, el) => !postUrlsToKeep[$('.post-card-content-link', el).attr('href')])
            .remove();

        $('.post-feed').before(template);

        new Vue({
            el: '#app',
            data: {
                clients: Array.from(byClient),
                hasExtraPosts: individualPosts.length > 0,
            },
        });
    };

    loadData();
});
