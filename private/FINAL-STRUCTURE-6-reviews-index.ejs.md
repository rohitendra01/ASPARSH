<!-- views/reviews/index.ejs - LIST ALL REVIEW LINKS FOR PROFILE -->

<%- include('../partials/flash') %>

<div class="container mt-4">
    <div class="row">
        <div class="col-md-12">
            <div class="card">
                <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                    <h4 class="mb-0">⭐ Review Links for <%= profile.name %></h4>
                    <a href="/dashboard/<%= slug %>/profiles/<%= slug %>/reviews/new" class="btn btn-sm btn-light">
                        ➕ Create New Link
                    </a>
                </div>
                <div class="card-body">

                    <% if (reviewLinks && reviewLinks.length > 0) { %>
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead class="table-light">
                                    <tr>
                                        <th>Title</th>
                                        <th>Link Slug</th>
                                        <th>Type</th>
                                        <th>Stats</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <% reviewLinks.forEach(link => { %>
                                        <tr>
                                            <td>
                                                <strong><%= link.reviewTitle %></strong>
                                            </td>
                                            <td>
                                                <code><%= link.slug %></code>
                                            </td>
                                            <td>
                                                <% if (link.linkType === 'google_review') { %>
                                                    <span class="badge bg-success">Google</span>
                                                <% } else { %>
                                                    <span class="badge bg-info">Custom Form</span>
                                                <% } %>
                                            </td>
                                            <td>
                                                <small>
                                                    👁️ <%= link.viewCount %> views
                                                    <br>
                                                    ✨ <%= link.generationCount %> generations
                                                    <br>
                                                    📤 <%= link.submissionCount %> submissions
                                                </small>
                                            </td>
                                            <td>
                                                <% if (link.isActive) { %>
                                                    <span class="badge bg-success">✓ Active</span>
                                                <% } else { %>
                                                    <span class="badge bg-danger">✗ Inactive</span>
                                                <% } %>
                                            </td>
                                            <td>
                                                <div class="btn-group btn-group-sm" role="group">
                                                    <a href="/reviews/<%= link.slug %>" 
                                                       class="btn btn-outline-primary" 
                                                       target="_blank" 
                                                       title="Visit public page">
                                                        👁️
                                                    </a>
                                                    <button class="btn btn-outline-success" 
                                                            onclick="copyToClipboard('/reviews/<%= link.slug %>')"
                                                            title="Copy link">
                                                        📋
                                                    </button>
                                                    <form method="POST" 
                                                          action="/dashboard/<%= slug %>/profiles/<%= slug %>/reviews/<%= link._id %>/delete" 
                                                          style="display: inline;">
                                                        <input type="hidden" name="_csrf" value="<%= csrfToken %>">
                                                        <button type="submit" 
                                                                class="btn btn-outline-danger" 
                                                                onclick="return confirm('Delete this review link?')"
                                                                title="Delete">
                                                            🗑️
                                                        </button>
                                                    </form>
                                                </div>
                                            </td>
                                        </tr>
                                    <% }); %>
                                </tbody>
                            </table>
                        </div>
                    <% } else { %>
                        <div class="alert alert-info text-center">
                            <p class="mb-0">No review links created yet.</p>
                            <a href="/dashboard/<%= slug %>/profiles/<%= slug %>/reviews/new" class="btn btn-primary btn-sm mt-2">
                                ➕ Create Your First Link
                            </a>
                        </div>
                    <% } %>

                </div>
            </div>
        </div>
    </div>
</div>

<script>
    function copyToClipboard(text) {
        const fullUrl = window.location.origin + text;
        navigator.clipboard.writeText(fullUrl).then(() => {
            alert('✅ Link copied: ' + fullUrl);
        }).catch(err => {
            console.error('Copy failed:', err);
            alert('Failed to copy');
        });
    }
</script>
