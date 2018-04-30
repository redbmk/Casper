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
        const authorFilter = { slug: authorSlug };

        const { posts } = await $.getJSON(ghost.url.api('posts', { include: 'authors,tags', limit: 'all' }));

        const tags = _.uniqBy(_.flatten(posts.map(post => post.tags)), 'id');
        const projects = _.remove(posts, post => post.tags.find(tag => tag.slug === 'projects'));
        const clientsById = _.filter(tags, { meta_title: 'client' }).reduce((collection, tag) => {
            collection[tag.id] = { tag, projects: [] };
            return collection;
        }, {});

        const authorPosts = posts.filter(post => _.find(post.authors, authorFilter));

        projects.forEach((project) => {
            project.posts = [];

            project.tags.forEach((tag) => {
                if (tag.meta_title === 'client') {
                    clientsById[tag.id].projects.push(project);
                } else if (tag.meta_title === 'project') {
                    project.posts = _.uniq([
                        ...project.posts,
                        ...authorPosts.filter(post => _.find(post.tags, { id: tag.id })),
                    ]);
                }
            });

            project.shouldShow = project.posts.length || !!_.find(project.authors, authorFilter);
        });

        const clients = Object.values(clientsById).map((client) => {
            const projects = _.filter(client.projects, 'shouldShow');
            return projects.length ? { ...client.tag, projects } : null;
        }).filter(Boolean);

        const filteredProjects = _.uniq(_.flatten(clients.map(({ projects }) => projects)));

        [...filteredProjects, ...authorPosts].forEach(post => {
            const text = $(post.html.replace(/<img .*?>/g, '')).text().trim();
            post.excerpt = text.split(/\s+/).slice(0, 33).join(' ');
        });

        const individualPosts = [...authorPosts];
        filteredProjects.forEach(({ posts }) => {
            posts.forEach(({ id }) => _.remove(individualPosts, { id }));
        });

        const postUrlsToKeep = _.groupBy(individualPosts, 'url');

        $('.author-stats').html('');
        updateStats('post', authorPosts.length);
        updateStats('project', filteredProjects.length);
        updateStats('client', clients.length);

        const template = await $.get('/assets/html/authors.html', { bust: +new Date() });

        $('.post-card')
            .filter((idx, el) => !postUrlsToKeep[$('.post-card-content-link', el).attr('href')])
            .remove();

        $('.post-feed').before(template);

        new Vue({
            el: '#app',
            data: {
                clients,
                hasExtraPosts: individualPosts.length > 0,
            },
        });
    };

    loadData();
});
