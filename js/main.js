//TODO: Fix x and y of color circles?
// var data_save;
// var data_new = []
// data_save.forEach(function(d) {
//     data_new.push({country_id: d.country_id, x: round(d.x,2), y: round(d.y,2)})
// })
// copy(data_new)

function create_GIRAI_chart() {

    ////////////////////////////////////////////////////////////// 
    ////////////////// Set-up sizes of the page //////////////////
    ////////////////////////////////////////////////////////////// 

    var container = d3.select("#chart");

    window.scroll(0, window.pageYOffset);
    //Remove anything that was still there
    container.selectAll("svg, canvas").remove();
    container.style("height", null);
    document.body.style.width = null;
    d3.selectAll(".outer-container")
        .style("width", null)
        .style("margin-left", null)
        .style("margin-right", null)
        .style("padding-left", null)
        .style("padding-right", null);
    d3.selectAll(".manga-img").style("display", null);
    d3.selectAll(".manga-mobile-img").style("display", null);
    d3.selectAll(".manga-img div")
        .style("height", null)
        .style("width", null);
    d3.selectAll(".issue-group").style("height", null);
    d3.select("#annotation-explanation").style("display", null);


    var base_width = 1600;
    var ww = window.innerWidth,
        wh = window.innerHeight;
    var width_too_small = ww < 500;

    var width;
    if (wh < ww) {
        width = wh / 0.7;
    } else {
        if (ww < width_too_small) width = ww / 0.5;
        else if (ww < 600) width = ww / 0.6;
        else if (ww < 800) width = ww / 0.7;
        else if (ww < 1100) width = ww / 0.8;
        else width = ww / 0.8;
    } //else
    width = Math.round(Math.min(base_width, width));
    var height = width;

    //Scaling the entire visual, as compared to the base size
    var size_factor = width / base_width;

    //Adjust the general layout based on the width of the visual
    container.style("height", height + "px");
    //Reset the body width
    var annotation_padding = width_too_small ? 0 : 240 * size_factor;
    var total_chart_width = width + annotation_padding;
    var no_scrollbar_padding = total_chart_width > ww ? 0 : 20;
    if (total_chart_width > ww) document.body.style.width = total_chart_width + 'px';
    var outer_container_width = Math.min(base_width, ww - no_scrollbar_padding - 2 * 20); //2 * 20px padding
    d3.selectAll(".outer-container").style("width", outer_container_width + "px");

  

    //Do the read-more button
    d3.selectAll(".read-more").style("display", "none");
    var do_display_more = false;
    d3.select("#read-more-button p")
        .style("display", "inline-block")
        .html("read more...")
        .on("click", function() {
            do_display_more = !do_display_more;
            d3.select("#read-more-button p").html(do_display_more ? "hide extra info" : "read more...");
            d3.selectAll(".read-more").style("display", do_display_more ? null : "none");
        });

    //Move the window to the top left of the text if the chart is wider than the screen
    if (total_chart_width > ww) {
        var pos = document.getElementById("top-outer-container").getBoundingClientRect();
        var scrollX = pos.left - 15;
        if (total_chart_width - ww < pos.left) {
            scrollX = (total_chart_width - ww) / 2;
        } else if (outer_container_width >= base_width) scrollX = pos.left - (parseInt(document.body.style.width) - pos.width) / 4 - 10;
        //Scroll to the new position on the horizontal
        window.scrollTo(scrollX, window.pageYOffset);

        //This doesn't work in all browsers, so check (actually it only doesn't seem to work in Chrome mobile...)
        if (Math.abs(window.scrollX - scrollX) > 2) {
            window.scrollTo(0, window.pageYOffset)
            d3.selectAll(".outer-container")
                .style("margin-left", 0 + "px")
                .style("margin-right", 0 + "px")
                .style("padding-left", 30 + "px")
                .style("padding-right", 30 + "px")
        } //if
    } //if

    document.querySelector('html').style.setProperty('--annotation-title-font-size', Math.min(14, 15 * size_factor) + 'px')
    document.querySelector('html').style.setProperty('--annotation-label-font-size', Math.min(14, 15 * size_factor) + 'px')

    ////////////////////////////////////////////////////////////// 
    //////////////////// Create SVG & Canvas /////////////////////
    ////////////////////////////////////////////////////////////// 

    //Canvas
    var canvas = container.append("canvas").attr("id", "canvas-target")
    var ctx = canvas.node().getContext("2d");
    crispyCanvas(canvas, ctx, 2);
    ctx.translate(width / 2, height / 2);
    //General canvas settings
    ctx.globalCompositeOperation = "multiply";
    ctx.lineCap = "round";
    ctx.lineWidth = 3 * size_factor;

    //SVG container
    var svg = container.append("svg")
        .attr("id", "GIRAI-SVG")
        .attr("width", width)
        .attr("height", height);

    var chart = svg.append("g")
        .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

    // //Test to see the window width on mobile
    // chart.append("text")
    //     .attr("x", -width/2 + 20)
    //     .attr("y", -height/2 + 20)
    //     .style("fill","black")
    //     .text(ww)

    var defs = chart.append("defs");

    //////////////////////////////////////////////////////////////
    //////////////// Initialize helpers and scales ///////////////
    //////////////////////////////////////////////////////////////

    var num_countries = 138,
        num_continent = 6;
    var pi2 = 2 * Math.PI,
        pi1_2 = Math.PI / 2;

    var cover_alpha = 0.3;
    var simulation;
    var remove_text_timer;

    var color_purple = "#5C1EFB",
        color_blue = "#A1F5EA",
        color_white = "#F1FBF9",
        color_africa = "#78380F",
        color_asia = "#FF9000",
        color_europe = "#FF4C00"
        color_north_america = "#23778F",
        color_oceania = "#1F543D",
        color_south_america = "#8D1E2B";



    //Has a mouseover just happened
    var mouse_over_in_action = false;

    //Radii at which the different parts of the visual should be created
    var rad_card_label = width * 0.4, //capture card text on the outside
        rad_cover_outer = width * 0.395, //outside of the hidden cover hover
        rad_cover_inner = width * 0.350, //inside of the hidden cover hover
        // rad_continent_donut_outer = width * 0.427, //outer radius of the continent donut
        // rad_continent_donut_inner = width * 0.425, //inner radius of the continent donut
        rad_color = width * 0.373, //color circles' center
        rad_country_outer = width * 0.3499, //outside of the hidden country hover
        rad_continent_inner = width * 0.343, //radius of the continent arcs
        rad_country_donut_outer = width * 0.334, //outer radius of the country donut
        rad_country_donut_inner = width * 0.32, //inner radius of the country donut
        rad_country_inner = width * 0.30, //outside of the hidden country hover
        rad_dot_color = width * 0.32, //country dot
        rad_line_max = 0.31,
        rad_line_min = 0.215,
        rad_line_label = width * 0.29, //textual label that explains the hovers
        rad_donut_inner = width * 0.122, //inner radius of the issue donut
        rad_donut_outer = width * 0.15, //outer radius of the issue donut
        rad_sub_donut_inner = width * 0.11,
        rad_sub_donut_outer = width * 0.121,
        rad_name = rad_donut_outer + 8 * size_factor, //padding between issue donut and start of the issue name
        rad_image = rad_donut_inner - 4 * size_factor; //radius of the central image shown on hover
        rad_relation = rad_donut_inner - 8 * size_factor; //padding between issue donut and inner lines

    //Angle for each country on the outside
    var angle = d3.scaleLinear()
        .domain([0, num_countries])
        .range([pi2 / num_countries / 2, pi2 + pi2 / num_countries / 2]);

    //Radius scale for the color circles
    var radius_scale = d3.scaleSqrt()
        .domain([0, 1])
        .range([0, 20]);


    ///////////////////////////////////////////////////////////////////////////
    //////////////////////////// Read in the data /////////////////////////////
    ///////////////////////////////////////////////////////////////////////////

    d3.queue()
        .defer(d3.json, "data/girai_country_hierarchy.json")
        .defer(d3.json, "data/girai_country_name.json")
        .defer(d3.json, "data/girai_issue_per_country.json")
        .defer(d3.csv, "data/girai_issue_total.csv")
        .defer(d3.json, "data/girai_continent.json")
        .defer(d3.csv, "data/girai_countrycode.csv")
        .await(draw);

    function draw(error, country_hierarchy_data, country_name, issue_data, issue_total_data, continent_identity_data, country_data) {

        if (error) throw error;

        ///////////////////////////////////////////////////////////////////////////
        ///////////////////////// Calculate country locations /////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        country_hierarchy_data = country_hierarchy_data.filter(function(d) {
            return d.name === "GIRAI" || (d.continent_num <= num_continent && !d.num) || (d.num >= 1 && d.num <= num_countries);
        });
        //Based on typical hierarchical clustering example
        var root = d3.stratify()
            .id(function(d) {
                return d.name;
            })
            .parentId(function(d) {
                return d.parent;
            })
            (country_hierarchy_data);
        var cluster = d3.cluster()
            .size([360, rad_dot_color])
            .separation(function separation(a, b) {
                return a.parent == b.parent ? 1 : 1.3;
            });
        cluster(root);
        var country_location_data = root.leaves()
        country_location_data.forEach(function(d, i) {
            d.centerAngle = d.x * Math.PI / 180;
        });

        //The distance between two countries that belong to the same continent
        var country_angle_distance = country_location_data[1].centerAngle - country_location_data[0].centerAngle;

        //Add some useful metrics to the country data
        country_location_data.forEach(function(d, i) {
            d.startAngle = d.centerAngle - country_angle_distance / 2;
            d.endAngle = d.centerAngle + country_angle_distance / 2;
        })

        ///////////////////////////////////////////////////////////////////////////
        ///////////////////////////// Final data prep /////////////////////////////
        ///////////////////////////////////////////////////////////////////////////

        issue_total_data.forEach(function(d) {
            d.num_countries = +d.num_countries;
        }) //forEach
        var issue_names = issue_total_data.map(function(d) {
            return d.issue;
        });

        //Sort cover data according to issues from total
        function sortissue(a, b) {
            return issue_names.indexOf(a.issue) - issue_names.indexOf(b.issue);
        }
        issue_data.sort(sortissue);
        issue_data.sort(sortissue);

        country_data = country_data.filter(function(d) {
            return d.country <= num_countries;
        })
        country_data.forEach(function(d) {
            d.cluster = d.country - 1;
            d.radius = radius_scale(1);

            //The center of gravity for this datapoint
            d.focusX = rad_color * Math.cos(country_location_data[d.cluster].centerAngle - pi1_2);
            d.focusY = rad_color * Math.sin(country_location_data[d.cluster].centerAngle - pi1_2);
            //Add a bit of random to not get weird placement behavior in the simulation
            d.x = d.focusX ;
            d.y = d.focusY ;
        }) //forEach


  

        data_save = country_data; //So I save the final positions


        //////////////////////////////////////////////////////////////
        /////////////// Create text in center of chart ////////////////
        //////////////////////////////////////////////////////////////
        
        
        var centralLabelGroup = chart.append("g")
        .attr("class", "central-label-group")
        // .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")"); // Center the label


        
        
        // Add a text element to the group
        var mainText = centralLabelGroup.append("text")
            .attr("class", "maintext-label")
            .attr("text-anchor", "middle")
            .attr("dy", (-0.8 * size_factor) + "em")  // Align vertically
            .style("font-size", (30 * size_factor) + "px")
            .style("font-weight", (900 * size_factor))
            .style("fill", "black")
            .text("Global Index"); // Initial text

        var mainSecondText = centralLabelGroup.append("text")
            .attr("class", "mainsecondtext-label")
            .attr("text-anchor", "middle")
            .attr("dy", (0.8 * size_factor) + "em")  // Align vertically
            .style("font-size", (30 * size_factor) + "px")
            .style("font-weight", (900 * size_factor))
            .style("fill", "black")
            .text("on Responsible AI"); // Initial text

        var secondText = centralLabelGroup.append("text")
            .attr("class", "secondtext-label")
            .attr("text-anchor", "middle")
            .attr("dy", (3 * size_factor) + "em")  // Align vertically
            .style("font-size", (30 * size_factor) + "px")
            .style("font-weight", (500 * size_factor))
            .style("fill", "black")
            .text("10 Issues"); // Initial text

        var thirdText = centralLabelGroup.append("text")
            .attr("class", "thirdtext-label")
            .attr("text-anchor", "middle")
            .attr("dy", (-5 * size_factor) + "em")  // Align vertically
            .style("font-size", (20 * size_factor) + "px")
            .style("font-weight", (500 * size_factor))
            .style("fill", "black")
            .text("138 Countries"); // Initial text

        // Function to update the central label dynamically
        function updateCentralLabel(newText) {
            // Define maximum length for a single line
            var maxLength = 25;
            

            if (newText.length > maxLength) {
                // Split text into two parts
                var firstPart = newText.substring(0, maxLength);
                var splitPoint = firstPart.lastIndexOf(' ');

                if (splitPoint !== -1) {
                    // If a space was found, split the text at the last space
                    firstPart = newText.substring(0, splitPoint);
                    var secondPart = newText.substring(splitPoint + 1); // Skip the space itself
                } else {
                    // If no space is found, split the text at maxLength
                    var secondPart = newText.substring(maxLength);
                }

                mainText.text(firstPart).attr("dy", (-0.8 * size_factor) + "em");
                mainSecondText.text(secondPart).style("display", "block").attr("dy", (0.8 * size_factor) + "em"); // Show second line
            } else {
                mainText.text(newText).attr("dy", "0em");
                mainSecondText.text("").style("opacity", 0); // Hide second line
            }
        }
        

       


        ///////////////////////////////////////////////////////////////////////////
        /////////////////////// Create issue donut chart //////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        //Arc command for the issue donut chart
        var arc = d3.arc()
            .outerRadius(rad_donut_outer)
            .innerRadius(rad_donut_inner)
            .padAngle(0.01)
            // .cornerRadius((rad_donut_outer - rad_donut_inner) / 2 * 1)
        //Pie function to calculate sizes of donut slices
        var pie = d3.pie()
            .sort(null)
            .value(function(d) {
                return d.num_countries;
            });

        var arcs = pie(issue_total_data);
        arcs.forEach(function(d, i) {
            d.issue = issue_total_data[i].issue;
            d.centerAngle = (d.endAngle - d.startAngle) / 2 + d.startAngle;
        });

        //Create the donut slices per issue (and the number of countries they appeared in)
        var donut_group = chart.append("g").attr("class", "donut-group");
        var slice = donut_group.selectAll(".arc")
            .data(arcs)
            .enter().append("path")
            .attr("class", "arc")
            .attr("d", arc)
            .style("fill", function(d) {
                return d.data.color;
            });

   

        ///////////////////////////////////////////////////////////////////////////
        ///////////////////////////// Create name labels //////////////////////////
        /////////////////////////////////////////////////////////////////////////// 
    

        var hover_circle_group = chart.append("g").attr("class", "hover-circle-group");
        var name_group = chart.append("g").attr("class", "name-group");

        var names_arc = name_group.selectAll(".text-arc")
            .data(arcs)
            .enter().append("path")
            .attr("class", "text-arc")
            .attr("id", function(d, i) {
                return "text-arc-" + i;
            })
            .attr("d", function(d) {
                var arc = d3.arc()
                    .innerRadius(rad_donut_outer + 20 * size_factor)
                    .outerRadius(rad_donut_inner)
                    .startAngle(d.startAngle-4)
                    .endAngle(d.endAngle);
                return arc();
            })
            .style("fill", "none")
            .style("stroke", "none");  // Ensure the path is invisible

        //Create a group per character
        var names = name_group.selectAll(".name")
            .data(arcs)
            .enter().append("g")
            .attr("class", "name")
            .style("text-anchor", function(d) {
                return d.centerAngle > 0 & d.centerAngle < Math.PI ? "start" : "end";;
            })
            .style("font-family", "Barlow")

        // // Add the big "main" name along the arc
        names.append("text")
            .attr("class", "name-label")
            .attr("id", function(d, i) {
                return "name-label-" + i;
            })
            .append("textPath")
            .attr("href", function(d, i) {
                return "#text-arc-" + i;
            })
            .attr("startOffset", "50%") // Center text along the path
            .style("text-anchor", "middle")
            .style("font-size", (12 * size_factor) + "px")
            .text(function(d, i) {
                return issue_total_data[i].first_name;
            });
        
        // Add the smaller last name below the main name along the same arc
        names.append("text")
            .attr("class", "last-name-label")
            .attr("id", function(d, i) {
                return "last-name-label-" + i;
            })
            .attr("dy", "0.5em")  // Adjust vertical offset for the last name
            .append("textPath")
            .attr("href", function(d, i) {
                return "#text-arc-" + i;
            })
            .attr("startOffset", "50%") // Center text along the path
            
            .style("text-anchor", "middle")
            .style("font-size", (12 * size_factor) + "px")
            .text(function(d, i) {
                return issue_total_data[i].last_name;
            });
        
        
        

        ///////////////////////////////////////////////////////////////////////////
        ///////////////////////////// Create name dots ////////////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        var issueByName = [];
        //Color of the dot behind the name can be the type
        issue_total_data.forEach(function(d, i) {
            var text_width_first = document.getElementById('name-label-' + i).getComputedTextLength();
            var text_width_last = document.getElementById('last-name-label-' + i).getComputedTextLength();
            d.dot_name_rad = rad_donut_outer + 40 * size_factor;
            d.name_angle = (arcs[i].endAngle - arcs[i].startAngle) / 2 + arcs[i].startAngle;

            issueByName[d.issue] = d;
        }) //forEach

        //Create hover circle that shows when you hover over a issue
        var rad_hover_circle = 35 * size_factor;
        var hover_circle = hover_circle_group.selectAll(".hover-circle")
            .data(issue_total_data)
            .enter().append("circle")
            .attr("class", "hover-circle")
            .attr("cx", function(d) {
                return d.dot_name_rad * Math.cos(d.name_angle - pi1_2);
            })
            .attr("cy", function(d) {
                return d.dot_name_rad * Math.sin(d.name_angle - pi1_2);
            })
            .attr("r", rad_hover_circle)
            .style("fill", function(d) {
                return d.color;
            })
            .style("fill-opacity", 0.3)
            .style("opacity", 0);

        //Add a circle at the end of each name of each issue
        var name_dot_group = chart.append("g").attr("class", "name-dot-group");
        var name_dot = name_dot_group.selectAll(".type-dot")
            .data(issue_total_data)
            .enter().append("circle")
            .attr("class", "type-dot")
            .attr("cx", function(d) {
                return d.dot_name_rad * Math.cos(d.name_angle - pi1_2);
            })
            .attr("cy", function(d) {
                return d.dot_name_rad * Math.sin(d.name_angle - pi1_2);
            })
            .attr("r", 6 * size_factor)
            .style("fill", function(d) {
                return d.color;
            })
            .style("stroke", "white")
            .style("stroke-width", 3 * size_factor);


        ///////////////////////////////////////////////////////////////////////////
        //////////////////////// Create cover country circle //////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        //Add a circle at the center that will show the cover image on hover
        var cover_circle_group = chart.append("g").attr("class", "cover-circle-group");
        var cover_circle = cover_circle_group.append("circle")
            .attr("class", "cover-circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", rad_image)
            .style("fill", "none");

        ///////////////////////////////////////////////////////////////////////////
        ////////////////////// Create hidden name hover areas /////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        var arc_issue_hover = d3.arc()
            .outerRadius(function(d, i) {
                return issue_total_data[i].dot_name_rad + rad_hover_circle;
            })
            .innerRadius(rad_donut_inner)

        //Create the donut slices per issue (and the number of countries they appeared in)
        var issue_hover_group = chart.append("g").attr("class", "issue-hover-group");
        var issue_hover = issue_hover_group.selectAll(".issue-hover-arc")
            .data(arcs)
            .enter().append("path")
            .attr("class", "issue-hover-arc")
            .attr("d", arc_issue_hover)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", mouse_over_issue)
            .on("mouseout", mouse_out);

        function mouse_over_issue(d) {
            d3.event.stopPropagation();
            mouse_over_in_action = true;

            //Show the chosen lines
            ctx.clearRect(-width / 2, -height / 2, width, height);
            ctx.globalAlpha = 0.8;
            create_lines("issue", issue_data.filter(function(c, j) {
                return c.issue === d.issue;
            }));

            //Update label path
            line_label_path.attr("d", label_arc(issueByName[d.issue].name_angle));
            //Update the label text
            clearTimeout(remove_text_timer);
            var label_words =  d.issue + " Appears";
            line_label.text("Countries that Issue Number " + label_words + " in");

            updateCentralLabel(issue_total_data[d.issue-1].full_name);

            
            mainText.style("font-size", (25 * size_factor) + "px").style("fill", issue_total_data[d.issue-1].color);
            mainSecondText.style("font-size", (25 * size_factor) + "px").style("fill", issue_total_data[d.issue-1].color);
            secondText.text(issue_total_data[d.issue-1].num_countries + ' Countries');
            thirdText.text("Issue no. " + d.issue);

            //Highlight the countries this issue appears in
            var char_countries = issue_data
                .filter(function(c) {
                    return c.issue === d.issue;
                })
                .map(function(c) {
                    return c.country;
                });
            var char_color = issueByName[d.issue].color;
            country_hover_slice.filter(function(c, j) {
                    return char_countries.indexOf(j + 1) >= 0;
                })
                .style("fill", char_color)
                .style("stroke", char_color);
            country_number.filter(function(c, j) {
                    return char_countries.indexOf(j + 1) >= 0;
                })
                .style("fill", "white");
            country_dot.filter(function(c, j) {
                    return char_countries.indexOf(j + 1) >= 0;
                })
                .attr("r", country_dot_rad * 1.5)
                .style("stroke-width", country_dot_rad * 0.5 * 1.5)
                .style("fill", char_color);

            //Show the issue image in the center
            // cover_image.attr("xlink:href", "img/issue-" + d.issue.toLowerCase() + ".jpg")
            cover_circle.style("fill", "url(#cover-image)");

            //Show the hover circle
            hover_circle.filter(function(c) {
                    return d.issue === c.issue;
                })
                .style("opacity", 1);

        } //function mouse_over_issue

        ///////////////////////////////////////////////////////////////////////////
        ///////////////////////// Create country donut chart //////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        //Create groups in right order
        var country_group = chart.append("g").attr("class", "country-group");
        var donut_country_group = country_group.append("g").attr("class", "donut-country-group");
        var country_dot_group = country_group.append("g").attr("class", "country-dot-group");
        var donut_country_hover_group = country_group.append("g").attr("class", "donut-country_hover-group");
        var country_num_group = country_group.append("g").attr("class", "country-number-group");

        //Arc command for the country number donut chart
        var arc_country = d3.arc()
            .outerRadius(rad_country_donut_outer)
            .innerRadius(rad_country_donut_inner)
            .padAngle(0.01)
            .cornerRadius((rad_country_donut_outer - rad_country_donut_inner) / 2)

        //Create the donut slices per issue (and the number of countries they appeared in)
        var country_slice = donut_country_group.selectAll(".arc")
            .data(country_location_data)
            .enter().append("path")
            .attr("class", "arc")
            .attr("d", arc_country)
            .style("fill", "none")
            .style("stroke", "#c4c4c4")
            .style("stroke-width", 1 * size_factor);
        //Create the donut slices per issue (and the number of countries they appeared in)
        var country_hover_slice = donut_country_hover_group.selectAll(".arc")
            .data(country_location_data)
            .enter().append("path")
            .attr("class", "arc")
            .attr("d", arc_country)
            .style("fill", "none")
            .style("stroke", "none")
            .style("stroke-width", 1.5 * size_factor);

        //The text is placed in the center of each donut slice
        var rad_country_donut_half = ((rad_country_donut_outer - rad_country_donut_inner) / 2 + rad_country_donut_inner);

        // Add country number text
        var country_number = country_num_group.selectAll(".country-number")
            .data(country_location_data)
            .enter().append("text")
            .attr("class", "country-number")
            .style("text-anchor", "middle")
            .attr("dy", ".35em")
            .attr("transform", function(d, i) {
                var angle = d.centerAngle * 180 / Math.PI - 90;
                return "rotate(" + angle + ")translate(" + rad_country_donut_half + ")" +
                    // (d.centerAngle > 0 & d.centerAngle < Math.PI ? "" : "rotate(180)")
                    "rotate(" + -angle + ")";
            })
            .style("font-size", (9 * size_factor) + "px")
            ;

        //Add a circle at the inside of each country slice
        var country_dot_rad = 3.5 * size_factor;
        var country_dot = country_dot_group.selectAll(".country-dot")
            .data(country_location_data)
            .enter().append("circle")
            .attr("class", "country-dot")
            .attr("cx", function(d) {
                return rad_dot_color * Math.cos(d.centerAngle - pi1_2);
            })
            .attr("cy", function(d) {
                return rad_dot_color * Math.sin(d.centerAngle - pi1_2);
            })
            .attr("r", country_dot_rad)
            .style("fill", "#c4c4c4")
            .style("stroke", "white")
            .style("stroke-width", country_dot_rad * 0.5);

        ///////////////////////////////////////////////////////////////////////////
        ///////////////////////// Create continent dotted line ///////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        //Create groups in right order
        var donut_continent_group = chart.append("g").attr("class", "donut-continent-group");

        //Create the arcs data
        var continent_data = [{
                continent: 1,
                num_countries: 41,
                country_start: 1,
                country_end: 41,
                color: color_africa
            },
            {
                continent: 2,
                num_countries: 38,
                country_start: 42,
                country_end: 79,
                color: color_asia
            },
            {
                continent: 3,
                num_countries: 31,
                country_start: 80,
                country_end: 110,
                color: color_europe
            },
            {
                continent: 4,
                num_countries: 16,
                country_start: 111,
                country_end: 126,
                color: color_north_america
            },
            {
                continent: 5,
                num_countries: 2,
                country_start: 127,
                country_end: 128,
                color: color_oceania
            },
            {
                continent: 6,
                num_countries: 10,
                country_start: 129,
                country_end: 138,
                color: color_south_america
            }
        ];
        continent_data = continent_data.filter(function(d) {
            return d.continent <= num_continent;
        });
        //Figure out the start and end angle
        continent_data.forEach(function(d, i) {
            d.startAngle = country_location_data[d.country_start - 1].startAngle,
                d.endAngle = country_location_data[d.country_end - 1].endAngle;
            d.centerAngle = (d.endAngle - d.startAngle) / 2 + d.startAngle;
        });

        var continent_slice = donut_continent_group.selectAll(".continent-arc")
            .data(continent_data)
            .enter().append("path")
            .attr("class", "continent-arc")
            .style("stroke", "#c4c4c4")
            .style("stroke", function(d, i) {
                return d.color;
            })
            .style("stroke-width", 3 * size_factor)
            // .style("stroke-dasharray", "0," + (7 * size_factor))
            .attr("d", function(d, i) {
                var rad = rad_continent_inner,
                    xs = rad * Math.cos(d.startAngle - pi1_2),
                    ys = rad * Math.sin(d.startAngle - pi1_2),
                    xt = rad * Math.cos(d.endAngle - pi1_2),
                    yt = rad * Math.sin(d.endAngle - pi1_2)
                return "M" + xs + "," + ys + " A" + rad + "," + rad + " 0 0 1 " + xt + "," + yt;
            });

        

        

        //////////////////////////////////////////////////////////////
        ///////////////////// Create flag patterns ///////////////////
        //////////////////////////////////////////////////////////////



        function addFlagDefinitions() {
            var defs = svg.append("defs");
            defs.selectAll(".flag")
                .data(country_data) // Assuming country_data has the country data including CountryCode
                .enter()
                .append("pattern")
                .attr("id", function(d) { return d.CountryCode; })
                .attr("class", "flag")
                .attr("width", "100%")
                .attr("height", "100%")
                .attr("patternContentUnits", "objectBoundingBox")
                .append("image")
                .attr("width", 1)
                .attr("height", 1)
                .attr("preserveAspectRatio", "xMidYMid slice")
                .attr("xlink:href", function(d) {
                    return "flags/" + d.CountryCode + ".svg"; // Path to flag images
                });
        }



        // Call the function to add flag definitions
        addFlagDefinitions();


        var color_circle = chart.selectAll(".color-circle")
            .data(country_data)
            .enter()
            .append("circle")
            .attr("class", "color-circle")
            .attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })
            .attr("r", function(d) { return d.radius * size_factor; })
            .style("fill", function(d) { return "url(#" + d.CountryCode + ")"; }) // Use CountryCode for flag pattern
            .style("stroke", function(d) { return "url(#" + d.CountryCode + ")"; })
            .style("stroke-width", 3 * size_factor);   
        

        ///////////////////////////////////////////////////////////////////////////
        //////////////////////// Create hover color circle ////////////////////////
        ///////////////////////////////////////////////////////////////////////////  

        //The stroked circle around the color circles that appears on a hover
        var color_circle_hover_group = chart.append("g").attr("class", "color-circle-hover-group");
        var color_hover_circle = color_circle_hover_group
            // .selectAll(".color-hover-circle")
            // .data(country_location_data)
            // .enter()
            .append("circle")
            .attr("class", "color-hover-circle")
            // .attr("cx", function (d) { return rad_color * Math.cos(d.centerAngle - pi1_2); })
            // .attr("cy", function (d) { return rad_color * Math.sin(d.centerAngle - pi1_2); })
            .attr("r", 36 * size_factor)
            .style("fill", "none")
            .style("stroke", color_purple)
            .style("stroke-width", country_dot_rad * 0.5 * 1.5)
            .style("opacity", 0);

        ///////////////////////////////////////////////////////////////////////////
        ////////////////////// Create hidden cover hover areas ////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        var arc_cover_hover = d3.arc()
            .outerRadius(rad_cover_outer)
            .innerRadius(rad_cover_inner);

        //Create the donut slices per country
        var cover_hover_group = chart.append("g").attr("class", "cover-hover-group");
        var cover_hover = cover_hover_group.selectAll(".cover-hover-arc")
            .data(country_location_data)
            .enter().append("path")
            .attr("class", "cover-hover-arc")
            .attr("d", arc_cover_hover)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", mouse_over_cover)
            .on("mouseout", mouse_out);

        //When you mouse over a country arc
        function mouse_over_cover(d, i) {
            d3.event.stopPropagation();
            mouse_over_in_action = true;

            ctx.clearRect(-width / 2, -height / 2, width, height);
            ctx.lineWidth = 4 * size_factor;
            ctx.globalAlpha = 1;
            create_lines("issue", issue_data.filter(function(c) {
                return c.country === i + 1;
            }));

            //Update label path
            line_label_path.attr("d", label_arc(d.centerAngle));
            //Update the label text
            clearTimeout(remove_text_timer);
            line_label.text("Issues Need to be Solved by " + country_data[i].CountryName);

            updateCentralLabel(country_data[i].CountryName);
            // mainText.text(country_data[i].CountryName);
            mainText.style("fill", country_data[i].color);
            mainSecondText.style("fill", country_data[i].color);
            secondText.text('Index Score : ' + country_data[i].IndexScore);
            thirdText.text("Ranking " + Number(country_data[i].Ranking));

            //Highlight the issues that appear in this country
            var char_countries = issue_data
                .filter(function(c) {
                    return c.country === i + 1;
                })
                .map(function(c) {
                    return c.issue;
                });

            names.filter(function(c) {
                    return char_countries.indexOf(c.issue) < 0;
                })
                .style("opacity", 0.2);
            name_dot.filter(function(c) {
                    return char_countries.indexOf(c.issue) < 0;
                })
                .style("opacity", 0.2);

            //Highlight the country donut slice
            country_hover_slice.filter(function(c, j) {
                    return i === j;
                })
                .style("stroke-width", country_dot_rad * 0.5 * 1.5)
                .style("stroke", color_purple);
            country_dot.filter(function(c, j) {
                    return i === j;
                })
                .attr("r", country_dot_rad * 1.5)
                .style("stroke-width", country_dot_rad * 0.5 * 1.5)
                .style("fill", color_purple);

            //Show the cover image in the center
            // cover_image.attr("xlink:href", "img/ccs-country-" + (i + 1) + ".jpg")
            cover_circle.style("fill", "url(#cover-image)");

            //Show the circle around the color country group
            color_hover_circle
                .attr("cx", rad_color * Math.cos(d.centerAngle - pi1_2))
                .attr("cy", rad_color * Math.sin(d.centerAngle - pi1_2))
                .style("opacity", 1);
        } //function mouse_over_cover

        ///////////////////////////////////////////////////////////////////////////
        ///////////////////////// General mouse out function //////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        container.on("mouseout", mouse_out);

        //When you mouse out of a country or issue
        function mouse_out() {
            //Only run this if there was a mouseover before
            if (!mouse_over_in_action) return;
            mouse_over_in_action = false;

            ctx.clearRect(-width / 2, -height / 2, width, height);
            ctx.globalAlpha = cover_alpha;
            create_lines("issue", issue_data);

            //Update the label text
            line_label.text(default_label_text)
            remove_text_timer = setTimeout(function() {
                line_label.text("")
            }, 6000);

           

            mainText.attr("class", "maintext-label")
                .attr("text-anchor", "middle")
                .attr("dy", (-0.8 * size_factor) + "em")  // Align vertically
                .style("font-size", (30 * size_factor) + "px")
                .style("font-weight", (900 * size_factor))
                .style("fill", "black")
                .text("Global Index"); // Initial text

            mainSecondText.attr("class", "mainsecondtext-label")
                .attr("text-anchor", "middle")
                .attr("dy", (0.8 * size_factor) + "em")  // Align vertically
                .style("font-size", (30 * size_factor) + "px")
                .style("font-weight", (900 * size_factor))
                .style("fill", "black")
                .style("opacity", 1)
                .text("on Responsible AI");

            secondText.attr("class", "secondtext-label")
                .attr("text-anchor", "middle")
                .attr("dy", (3 * size_factor) + "em")  // Align vertically
                .style("font-size", (30 * size_factor) + "px")
                .style("font-weight", (500 * size_factor))
                .style("fill", "black")
                .text("10 Issues"); // Initial text

            thirdText.attr("class", "thirdtext-label")
                .attr("text-anchor", "middle")
                .attr("dy", (-5 * size_factor) + "em")  // Align vertically
                .style("font-size", (20 * size_factor) + "px")
                .style("font-weight", (500 * size_factor))
                .style("fill", "black")
                .text("138 Countries");

            //issue names back to normal
            names.style("opacity", null);
            name_dot.style("opacity", null);

            //issue names back to normal
            names.style("opacity", null);
            name_dot.style("opacity", null);

            //country donut back to normal
            country_hover_slice.style("fill", "none").style("stroke", "none");
            country_number.style("fill", null);
            country_dot
                .attr("r", country_dot_rad)
                .style("stroke-width", country_dot_rad * 0.5)
                .style("fill", "#c4c4c4");

            //Remove cover image
            cover_circle.style("fill", "none");
            // cover_image.attr("xlink:href", "img/white-square.jpg");

            //Hide the hover circle
            hover_circle.style("opacity", 0);
            //Hide the circle around the color country group
            color_hover_circle.style("opacity", 0);

            //Bring all relationships back
            relation_lines.style("opacity", 0.7);
            //Remove relationship annotation
            annotation_relation_group.selectAll(".annotation").remove();
        } //function mouse_out

        ///////////////////////////////////////////////////////////////////////////
        //////////////////////// Create captured card labels //////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        var card_group = chart.append("g").attr("class", "card-group");

        //Create a group per issue
        var card_label = card_group.selectAll(".card-label")
            .data(country_name)
            .enter().append("text")
            .attr("class", "card-label")
            .attr("dy", ".35em")
            .each(function(d, i) {
                d.centerAngle = country_location_data[d.country - 1].centerAngle;
            })
            .attr("transform", function(d, i) {
                return "rotate(" + (d.centerAngle * 180 / Math.PI - 90) + ")" +
                    "translate(" + rad_card_label + ")" +
                    (d.centerAngle > 0 & d.centerAngle < Math.PI ? "" : "rotate(180)");
            })
            .style("text-anchor", function(d) {
                return d.centerAngle > 0 & d.centerAngle < Math.PI ? "start" : "end";
            })
            .style("font-size", (10 * size_factor) + "px")
            .text(function(d, i) {
                return d.country_name;
            });

        
        ///////////////////////////////////////////////////////////////////////////
        ///////////////////////// Create line title label /////////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        var line_label_group = chart.append("g").attr("class", "line-label-group");

        //Define the arc on which to draw the label text
        function label_arc(angle) {
            var x1 = rad_line_label * Math.cos(angle + 0.01 - pi1_2),
                y1 = rad_line_label * Math.sin(angle + 0.01 - pi1_2);
            var x2 = rad_line_label * Math.cos(angle - 0.01 - pi1_2),
                y2 = rad_line_label * Math.sin(angle - 0.01 - pi1_2);
            if (angle / Math.PI > 0.5 && angle / Math.PI < 1.5) {
                return "M" + x1 + "," + y1 + " A" + rad_line_label + "," + rad_line_label + " 0 1 1 " + x2 + "," + y2;
            } else {
                return "M" + x2 + "," + y2 + " A" + rad_line_label + "," + rad_line_label + " 0 1 0 " + x1 + "," + y1;
            } //else
        } //function label_arc

        //Create the paths along which the pillar labels will run
        var line_label_path = line_label_group.append("path")
            .attr("class", "line-label-path")
            .attr("id", "line-label-path")
            .attr("d", label_arc(issueByName["2"].name_angle))
            .style("fill", "none")
            .style("display", "none");

        //Create the label text
        var default_label_text = "Currently, These Lines Show which Issues Appear in The Country";
        var line_label = line_label_group.append("text")
            .attr("class", "line-label")
            .attr("dy", "0.35em")
            .style("text-anchor", "middle")
            .style("font-size", (14 * size_factor) + "px")
            .append("textPath")
            .attr("xlink:href", "#line-label-path")
            .attr("startOffset", "50%")
            .text(default_label_text);

        ///////////////////////////////////////////////////////////////////////////
        ///////////////////////// Create continent name label /////////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        var continent_name_group = chart.append("g").attr("class", "continent-name-group");
        
        var continent_names_arc = continent_name_group.selectAll(".continent-text-arc")
            .data(continent_data)
            .enter().append("path")
            .attr("class", "continent-text-arc")
            .attr("id", function(d, i) {
                return "continent-text-arc-" + i;
            })
            .attr("d", function(d, i) {
                var rad = rad_continent_inner + 5 * size_factor,
                    xs = rad * Math.cos(d.startAngle - pi1_2),
                    ys = rad * Math.sin(d.startAngle - pi1_2),
                    xt = rad * Math.cos(d.endAngle - pi1_2),
                    yt = rad * Math.sin(d.endAngle - pi1_2)
                return "M" + xs + "," + ys + " A" + rad + "," + rad + " 0 0 1 " + xt + "," + yt;
            })
            .style("fill", "none")
            .style("stroke", "none");  // Ensure the path is invisible

        //Create a group per character
        var continent_names = continent_name_group.selectAll(".continent-name")
            .data(continent_data)
            .enter().append("g")
            .attr("class", "continent-name")
            .style("text-anchor", function(d) {
                return d.centerAngle > 0 & d.centerAngle < Math.PI ? "start" : "end";;
            })
            .style("font-family", "Barlow")
            .style("color", function(d) {
                return d.color;
            })

        // // Add the big "main" name along the arc
        continent_names.append("text")
            .attr("class", "continent-name-label")
            .attr("id", function(d, i) {
                return "continent-name-label-" + i;
            })
            .append("textPath")
            .attr("href", function(d, i) {
                return "#continent-text-arc-" + i;
            })
            .attr("startOffset", "50%") // Center text along the path
            .style("text-anchor", "middle")
            .style("font-size", (12 * size_factor) + "px")
            .style("fill", function(d) {
                return d.color;
            })
            .text(function(d, i) {
                return continent_identity_data[i].continent_name;
            });

        ///////////////////////////////////////////////////////////////////////////
        //////////////////// Create issue & country lines /////////////////////
        /////////////////////////////////////////////////////////////////////////// 

        //Line function to draw the lines from issue to country on canvas
        var line = d3.lineRadial()
            .angle(function(d) {
                return d.angle;
            })
            .radius(function(d) {
                return d.radius;
            })
            .curve(d3.curveBasis)
            .context(ctx);

        //Draw the lines for the cover
        ctx.globalAlpha = cover_alpha;
        create_lines("issue", issue_data);

        function create_lines(type, data) {

            for (var i = 0; i < data.length; i++) {
                d = data[i];
                var line_data = [];

                var source_a = issueByName[d.issue].name_angle,
                    source_r = issueByName[d.issue].dot_name_rad
                var target_a = country_location_data[d.country - 1].centerAngle,
                    target_r = rad_dot_color;

                //Figure out some variable that will determine the path points to create
                if (target_a - source_a < -Math.PI) {
                    var side = "cw";
                    var da = 2 + (target_a - source_a) / Math.PI;
                    var angle_sign = 1;
                } else if (target_a - source_a < 0) {
                    var side = "ccw";
                    var da = (source_a - target_a) / Math.PI;
                    var angle_sign = -1;
                } else if (target_a - source_a < Math.PI) {
                    var side = "cw";
                    var da = (target_a - source_a) / Math.PI;
                    var angle_sign = 1;
                } else {
                    var side = "ccw";
                    var da = 2 - (target_a - source_a) / Math.PI;
                    var angle_sign = -1;
                } //else
                //console.log(side, da, angle_sign);


                //Calculate the radius of the middle arcing section of the line
                var range = type === "issue" ? [rad_line_max, rad_line_min] : [rad_line_min, rad_line_max];
                var scale_rad_curve = d3.scaleLinear()
                    .domain([0, 1])
                    .range(range);
                var rad_curve_line = scale_rad_curve(da) * width;

                //Slightly offset the first point on the curve from the source
                var range = type === "issue" ? [0, 0.07] : [0, 0.01];
                var scale_angle_start_offset = d3.scaleLinear()
                    .domain([0, 1])
                    .range(range);
                var start_angle = source_a + angle_sign * scale_angle_start_offset(da) * Math.PI;

                //Slightly offset the last point on the curve from the target
                var range = type === "issue" ? [0, 0.02] : [0, 0.07];
                var scale_angle_end_offset = d3.scaleLinear()
                    .domain([0, 1])
                    .range(range);
                var end_angle = target_a - angle_sign * scale_angle_end_offset(da) * Math.PI;

                if (target_a - source_a < -Math.PI) {
                    var da_inner = pi2 + (end_angle - start_angle);
                } else if (target_a - source_a < 0) {
                    var da_inner = (start_angle - end_angle);
                } else if (target_a - source_a < Math.PI) {
                    var da_inner = (end_angle - start_angle);
                } else if (target_a - source_a < 2 * Math.PI) {
                    var da_inner = pi2 - (end_angle - start_angle)
                } //else if

                //Attach first point to data
                line_data.push({
                    angle: source_a,
                    radius: source_r
                });

                //Attach first point of the curve section
                line_data.push({
                    angle: start_angle,
                    radius: rad_curve_line
                });

                //Create points in between for the curve line
                var step = 0.06;
                var n = Math.abs(Math.floor(da_inner / step));
                var curve_angle = start_angle;
                var sign = side === "cw" ? 1 : -1;
                if (n >= 1) {
                    for (var j = 0; j < n; j++) {
                        curve_angle += (sign * step) % pi2;
                        line_data.push({
                            angle: curve_angle,
                            radius: rad_curve_line
                        });
                    } //for j
                } //if

                //Attach last point of the curve section
                line_data.push({
                    angle: end_angle,
                    radius: rad_curve_line
                });

                //Attach last point to data
                line_data.push({
                    angle: target_a,
                    radius: target_r
                });

                //Draw the path
                ctx.beginPath();
                line(line_data);
                ctx.strokeStyle = issueByName[d.issue].color;
                ctx.stroke();

            } //for

            ctx.globalAlpha = 0.7;
            ctx.lineWidth = 3 * size_factor;

        } //function create_lines

    } //function draw

    // Retina non-blurry canvas
    function crispyCanvas(canvas, ctx, sf) {
        canvas
            .attr('width', sf * width)
            .attr('height', sf * height)
            .style('width', width + "px")
            .style('height', height + "px");
        ctx.scale(sf, sf);
    } //function crispyCanvas

  

//////////////////////////////////////////////////////////////
////////////////////// Helper functions //////////////////////
//////////////////////////////////////////////////////////////

//Turn RGB into CMYK "circle radii"
function rgbToCMYK(rgb) {
    var r = rgb.r / 255,
        g = rgb.g / 255,
        b = rgb.b / 255,
        k = 1 - Math.max(r, g, b);

    return {
        cyan: (1 - r - k) / (1 - k),
        magenta: (1 - g - k) / (1 - k),
        yellow: (1 - b - k) / (1 - k),
        black: k
    };
} //function rgbToCMYK

//Get a "random" number generator where you can fix the starting seed
//https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript
var seed = 4;

function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
} //function random

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
} //function capitalizeFirstLetter