document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarItems = document.querySelectorAll('.sidebar-item.has-submenu');
    const logoImg = document.getElementById('logo-img');


    
    // Initialize: Close all submenus if sidebar is collapsed on page load
    if (!sidebar.classList.contains('expanded')) {
        sidebarItems.forEach(item => {
            item.classList.remove('active');
        });
    }
    
    // Toggle sidebar
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.toggle('expanded');
      
      // Close all submenus when sidebar is collapsed
      if (!sidebar.classList.contains('expanded')) {
        sidebarItems.forEach(item => {
          item.classList.remove('active');
        });
        logoImg.src = '/images/mini-logo.png';
      }else{
        logoImg.src = '/images/logo.png'; 
      }
      
      updateTooltips();
    });
    
    // Toggle submenu and handle sidebar expanding when clicking sidebar item
    sidebarItems.forEach(item => {
      const link = item.querySelector('.sidebar-link');
      const submenu = item.querySelector('.submenu');
      
      if (submenu) {
        // For items with submenus
        link.addEventListener('click', function(e) {
          e.preventDefault();
          
          // If sidebar is collapsed, expand it first and don't toggle submenu yet
          if (!sidebar.classList.contains('expanded')) {
            sidebar.classList.add('expanded');
            updateTooltips();
            return; // Don't toggle submenu on first click when sidebar is collapsed
          }
          
          // Close all other submenus
          sidebarItems.forEach(otherItem => {
            if (otherItem !== item && otherItem.classList.contains('active')) {
              otherItem.classList.remove('active');
            }
          });
          
          // Toggle current submenu
          item.classList.toggle('active');
        });
        
        // Add click handlers for submenu items
        const submenuLinks = submenu.querySelectorAll('a');
        submenuLinks.forEach(submenuLink => {
          submenuLink.addEventListener('click', function(e) {
            // Don't prevent default - allow navigation
            // Close sidebar on mobile
            if (window.innerWidth <= 768) {
              sidebar.classList.remove('expanded');
            }
          });
        });
      } else {
        // For items without submenus
        link.addEventListener('click', function(e) {
          // Don't prevent default - allow navigation
          // If sidebar is collapsed, expand it
          if (!sidebar.classList.contains('expanded')) {
            e.preventDefault();
            sidebar.classList.add('expanded');
            updateTooltips();
          }
        });
      }
    });
    
    // Close sidebar when clicking outside
    document.addEventListener('click', function(e) {
      if (sidebar.classList.contains('expanded')) {
        const clickedInside = sidebar.contains(e.target) || e.target === sidebarToggle;
        if (!clickedInside) {
          sidebar.classList.remove('expanded');
          
          // Close all submenus when sidebar is closed
          sidebarItems.forEach(item => {
            item.classList.remove('active');
          });
          
          updateTooltips();
        }
      }
    });
    
    // Set up tooltips for collapsed sidebar
    function updateTooltips() {
      const sidebarLinks = document.querySelectorAll('.sidebar-link');
      
      sidebarLinks.forEach(link => {
        if (!sidebar.classList.contains('expanded')) {
          link.setAttribute('data-tooltip', link.querySelector('.sidebar-text').textContent);
        } else {
          link.removeAttribute('data-tooltip');
        }
      });
    }
    
    // Update tooltips on sidebar state change
    updateTooltips();
    sidebar.addEventListener('transitionend', updateTooltips);
    
    // Add listener to ensure submenus close when sidebar state changes
    sidebar.addEventListener('transitionend', function(e) {
      if (e.propertyName === 'width' && !sidebar.classList.contains('expanded')) {
        sidebarItems.forEach(item => {
          item.classList.remove('active');
        });
      }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
      if (window.innerWidth <= 768) {
        sidebar.classList.remove('expanded');
        
        // Close all submenus when sidebar is collapsed due to resize
        sidebarItems.forEach(item => {
          item.classList.remove('active');
        });
      } else {
        sidebar.classList.add('expanded');
      }
      updateTooltips();
    });
});