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
        const postUrlsToRemove = _.groupBy([...projects, ...posts], 'url');

        clients.forEach(clientTag => {
            const clientProjects = clientTag.id
                ? _.remove(projects, ({ tags }) => _.find(tags, clientTag))
                : projects;

            const byProject = new Map();
            if (!clientProjects.length) return;

            clientProjects.forEach(project => {
                if (!project.id) return;

                const projectTags = _.filter(project.tags, { meta_title: 'project' });
                const tagIds = _.groupBy(projectTags, 'id');
                const projectPosts = posts
                    .filter(post => post.tags.find(tag => tagIds[tag.id]));

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

        const template = await $.get('/assets/html/authors.html');

        $('.post-card')
            .filter((idx, el) => postUrlsToRemove[$('.post-card-content-link', el).attr('href')])
            .remove();

        $('.post-feed').before(template);

        new Vue({
            el: '#app',
            data: {
                clients: Array.from(byClient),
                hasExtraPosts: postsWithoutProject.length > 0,
            },
        });
    };

    loadData();
});
