jQuery(($) => {
    const updateStats = (singular, numItems, fn = 'prepend') => {
        if (numItems) {
            const text = `${numItems} ${singular}${numItems > 1 ? 's' : ''}`;
            $('.author-stats')[fn](`${text} <span class="bull">&bull;</span>`);
        }
    };

    const loadData = async () => {
        const [, authorSlug] = /^\/author\/(.*?)\//.exec(window.location.pathname) || [];

        if (!authorSlug) return;

        let { posts } = await $.getJSON(ghost.url.api('posts', { include: 'authors,tags', limit: 'all' }));
        posts = posts.filter(post => post.authors.find(({ slug }) => authorSlug === slug))

        posts.forEach(post => {
            const text = $(post.html).text().trim();
            post.excerpt = text.split(/\s+/).slice(0, 33).join(' ');
        });


        const tags = _.uniqBy(_.flatten(posts.map(post => post.tags)), 'id');

        const projects = _.remove(posts, ({ tags }) => _.find(tags, { slug: 'project' }));
        const clients = _.filter(tags, { meta_title: 'client' });

        updateStats('post', posts.length, 'html');
        updateStats('project', projects.length);
        updateStats('client', clients.length);

        clients.push({ id: 0, name: 'No Client' });

        const byClient = new Map();

        const postsWithoutProject = _.remove(posts, post => !_.find(post.tags, { meta_title: 'project' }));

        clients.forEach(clientTag => {
            const clientProjects = clientTag.id
                ? _.remove(projects, ({ tags }) => _.find(tags, clientTag))
                : projects;

            const byProject = new Map();
            if (!clientProjects.length) return;
            if (!clientTag.id) {
                clientProjects.push({
                    id: 0,
                    title: 'No Project',
                    excerpt: 'The following posts are not associated with any project',
                });
            }

            clientProjects.forEach(project => {
                const projectTags = project.id
                    ? _.filter(project.tags, { meta_title: 'project' })
                    : [];

                const projectPosts = project.id
                    ? posts.filter(post => post.tags.find(({ id }) => _.find(projectTags, { id })))
                    : postsWithoutProject;

                byProject.set(project, projectPosts);

                const authors = _.flatten([
                    project.authors || [],
                    ...projectPosts.map(post => post.authors),
                ]);

                project.project_tag = projectTags[0];
                project.authors = _.uniqBy(authors, 'id');
            });

            byClient.set(clientTag, Array.from(byProject));
        });

        $('.post-feed').before(await $.get('/assets/html/authors.html'));

        new Vue({
            el: '#app',
            data: {
                clients: Array.from(byClient),
            },
        });
    };

    loadData();
});
