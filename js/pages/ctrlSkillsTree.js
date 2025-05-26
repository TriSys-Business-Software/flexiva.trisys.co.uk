// Self contained logic for populating two trees:
// source, destination
// User can check source skills and add these to the destination.
// User can check destination skills and remove these.
// Adding skills retains existing destination skills and categories and sorts them.
// Adding skills also removes the source skill to make it easier for users.
// Removing skills also adds these to the source skills for the same reason.
//
var ctrlSkillsTree =
{
    PopulateSource: function (sEntityName, parentDiv)
    {
        var categories = TriSysApex.Cache.SkillCategories();
        var skills = TriSysApex.Cache.Skills();

        // The ones we ignore
        var sIgnoreType = (sEntityName == "Task" ? sEntityName : "General");
        var sSetting = 'Ignore ' + sIgnoreType + ' Skill Categories';
        var sSystemSetting = TriSysApex.Cache.SystemSettingManager.GetValue(sSetting);
        var trimmedIgnoreCategories = ['Gender'];

        if (sSystemSetting)
        {
            var sSplitChar = (sEntityName == "Task" ? ";" : ",");           // Oops!
            var arrayIgnoreCategories = sSystemSetting.split(sSplitChar);

            $.each(arrayIgnoreCategories, function (index, sIgnore)
            {
                sIgnore = sIgnore.trim();
                trimmedIgnoreCategories.push(sIgnore);
            });
        }

        var ds = [];
        for (var c = 0; c < categories.length; c++)
        {
            var category = categories[c];
            var bFound = ($.inArray(category.Category, trimmedIgnoreCategories) >= 0);
            if (category.FieldId == 0 && !bFound)
            {
                var dsItems = [];
                for (var s = 0; s < skills.length; s++)
                {
                    var skill = skills[s];
                    if (skill.SkillCategoryId == category.SkillCategoryId)
                    {
                        var skillItem = { text: skill.Skill, id: category.Category + '|' + skill.Skill };
                        dsItems.push(skillItem);
                    }
                }

                if (dsItems.length > 0)
                {
                    var dsItem = { text: category.Category, expanded: false, items: dsItems };
                    ds.push(dsItem);
                }
            }
        }

        var sSuffix = '-' + parentDiv;
        var elemTree = $("#ctrlSkillsTree-Source" + sSuffix);
        elemTree.kendoTreeView({
            dragAndDrop: false,
            dataSource: ds,
            checkboxes: {
                checkChildren: true
            }
        });

        // Set as populated
        TriSysApex.ControlPopulationDirty.SetPopulated(parentDiv, true);
        TriSysApex.ControlPopulationDirty.SetDirty(parentDiv, false);

        // Force through the theme once again!
        setTimeout(TriSysProUI.kendoUI_Overrides, 1000);

        // 14 Mar 2024: Allow filtering of categories and skills
        ctrlSkillsTree.LoadObjectFilter(sSuffix);
    },

    AddSelectedSkills: function (sIDSuffix)
    {
        //debugger;
        var treeview = $("#ctrlSkillsTree-Source" + sIDSuffix).data("kendoTreeView");

        var checkedNodes = [];
        var bRemoveChecked = true;
        ctrlSkillsTree.ReadCheckedItems(treeview, treeview.dataSource.view(), checkedNodes, bRemoveChecked);

        var ds = ctrlSkillsTree.ConvertCheckedNodesToDataSet(checkedNodes, true);

        ctrlSkillsTree.AddSkillsDataSetToDestination(sIDSuffix, ds);
    },

    AddSkillsDataSetToDestination: function (sIDSuffix, ds)
    {
        var treeview = $("#ctrlSkillsTree-Destination" + sIDSuffix).data("kendoTreeView");
        if (!treeview)
        {
            $("#ctrlSkillsTree-Destination" + sIDSuffix).kendoTreeView({
                dragAndDrop: false,
                dataSource: ds,
                checkboxes: {
                    checkChildren: true
                }
            });
        }
        else
        {
            // We now have a data set which comprises the skills to be added, however there is an
            // existing set of skills which must survive and not be overwritten
            ctrlSkillsTree.AddDataSetToExistingTreeView(treeview, ds);
        }
    },

    // Called by BOTH add and remove button code for each added item
    AddDataSetToExistingTreeView: function(treeview, ds)
    {
        var updatedDataSource = [];
        var existingDataSource = treeview.dataSource.view();
        if (existingDataSource)
        {
            for (var i = 0; i < existingDataSource.length; i++)
            {
                var existingCategoryItem = existingDataSource[i];   // { text: category.Category, expanded: true, items: dsItems };

                // Add to existing categories in order
                for (var n = 0; n < ds.length; n++)
                {
                    var addCategoryItem = ds[n];
                    if (existingCategoryItem.text == addCategoryItem.text)
                    {
                        // Found matching category so add new items to existing
                        addCategoryItem.Added = true;
                        for (var s = 0; s < addCategoryItem.items.length; s++)
                        {
                            var addSkill = addCategoryItem.items[s];

                            var bFoundExistingSkill = false;
                            for (var e = 0; e < existingCategoryItem.items.length; e++)
                            {
                                var existingSkill = existingCategoryItem.items[e];
                                if (addSkill.text == existingSkill.text)
                                    bFoundExistingSkill = true;
                            }

                            if (!bFoundExistingSkill)
                                existingCategoryItem.items.push(addSkill);
                        }
                    }
                }

                // Sort the old and new items
                existingCategoryItem.items.sort(function (a, b)
                {
                    return a.text > b.text;
                });

                // Add to new data source
                updatedDataSource.push(existingCategoryItem);
            }

            // Append new categories and items to existing
            for (var i = 0; i < ds.length; i++)
            {
                var newCategoryItem = ds[i];   // { text: category.Category, expanded: true, items: dsItems };
                if (newCategoryItem.Added)
                    newCategoryItem.Added = true;
                else
                    updatedDataSource.push(newCategoryItem);
            }
        }

        // Sort the old and new tree roots
        updatedDataSource.sort(function (a, b)
        {
            return a.text > b.text;
        });

        // Update the full data source of all new and existing items
        treeview.setDataSource(updatedDataSource);
    },

    RemoveSelectedSkills: function (sIDSuffix)
    {
        var destinationTreeview = $("#ctrlSkillsTree-Destination" + sIDSuffix).data("kendoTreeView");
        var sourceTreeview = $("#ctrlSkillsTree-Source" + sIDSuffix).data("kendoTreeView");

        if (destinationTreeview)
        {
            var checkedNodes = [];
            var bRemoveChecked = false;
            ctrlSkillsTree.ReadCheckedItems(destinationTreeview, destinationTreeview.dataSource.view(), checkedNodes, bRemoveChecked);

            if (checkedNodes)
            {
                // Before removing these items, add them all back to the source again
                var ds = ctrlSkillsTree.ConvertCheckedNodesToDataSet(checkedNodes, false);
                ctrlSkillsTree.AddDataSetToExistingTreeView(sourceTreeview, ds);
            }

            // Remove those selected
            ctrlSkillsTree.RemoveCheckedItems(destinationTreeview, destinationTreeview.dataSource.view());
        }
    },

    // The checked nodes collection may contain a root and skills or just skills.
    // Convert this into a proper category+items hierarchy
    ConvertCheckedNodesToDataSet: function (checkedNodes, bExpanded)
    {
        var categories = [];
        for (var s = 0; s < checkedNodes.length; s++)
        {
            var checkedNode = checkedNodes[s];
            var sID = checkedNode.id;
            if (sID)
            {
                var sParts = sID.split("|");
                var sCategory = sParts[0];
                var sSkill = sParts[1];

                var bFoundCategory = false;
                for (var c = 0; c < categories.length; c++)
                {
                    var category = categories[c];
                    if (category.Category == sCategory)
                    {
                        bFoundCategory = true;
                        break;
                    }
                }
                if (!bFoundCategory)
                {
                    var category = { Category: sCategory };
                    categories.push(category);
                }
            }
        }

        // Now enumerate through categories and find all skills which match in order
        var ds = [];
        for (var c = 0; c < categories.length; c++)
        {
            var category = categories[c];
            var dsItems = [];

            for (var s = 0; s < checkedNodes.length; s++)
            {
                var checkedNode = checkedNodes[s];
                var sID = checkedNode.id;
                if (sID)
                {
                    var sParts = sID.split("|");
                    var sCategory = sParts[0];
                    var sSkill = sParts[1];

                    if (category.Category == sCategory)
                    {
                        var skillItem = { text: sSkill, id: sCategory + '|' + sSkill };
                        dsItems.push(skillItem);
                    }
                }
            }

            if (dsItems.length > 0)
            {
                var dsItem = { text: category.Category, expanded: bExpanded, items: dsItems };
                ds.push(dsItem);
            }
        }

        return ds;
    },

    ReadCheckedItems: function (treeview, nodes, checkedNodes, bRemoveChecked)
    {
        for (var i = 0; i < nodes.length; i++)
        {
            var node = nodes[i];
            var bRemoveNode = false;
            if (node.checked)
            {
                checkedNodes.push(node);

                if (bRemoveChecked)
                    bRemoveNode = true;
            }

            if (node.hasChildren)
            {
                ctrlSkillsTree.ReadCheckedItems(treeview, node.children.view(), checkedNodes, bRemoveChecked);
            }

            if(bRemoveNode)
            {
                var item = treeview.findByUid(node.uid);
                treeview.remove(item);
            }
        }
    },

    // Called to read all destination skills in preparation for sending to API
    ReadDestinationItems: function (parentDiv)
    {
        var sSuffix = '-' + parentDiv;
        var treeview = $("#ctrlSkillsTree-Destination" + sSuffix).data("kendoTreeView");
        if (treeview)
        {
            var nodes = [];
            ctrlSkillsTree.ReadSubNodes(treeview.dataSource.view(), nodes);

            return nodes;
        }
    },

    ReadSubNodes: function(nodes, readNodes)
    {
        for (var i = 0; i < nodes.length; i++)
        {
            var node = nodes[i];
            
            readNodes.push(node);

            if (node.hasChildren)
            {
                ctrlSkillsTree.ReadSubNodes(node.children.view(), readNodes);
            }
        }
    },

    // Remove checked items from tree view
    RemoveCheckedItems: function (treeview, nodes)
    {
        for (var i = 0; i < nodes.length; i++)
        {
            var node = nodes[i];
            if (node.checked)
            {
                var item = treeview.findByUid(node.uid);
                treeview.remove(item);
            }
            else if (node.hasChildren)
            {
                ctrlSkillsTree.RemoveCheckedItems(treeview, node.children.view());
            }
        }
    },

    // External function called by TriSysSDK.Attributes.Load() method to populate the assigned skills.
    AddAssignedSkills: function (parentDiv, listOfSkills)
    {
        // Convert skills into data source of type checked nodes
        if (!listOfSkills)
            return;

        // Sort the old and new tree roots
        listOfSkills.sort(function (a, b)
        {
            return (a.Category > b.Category) && (a.Skill > b.Skill);
        });

        var checkedNodes = [];
        for (var i = 0; i < listOfSkills.length; i++)
        {
            var skill = listOfSkills[i];
            var checkedNode = { text: skill.Skill, id: skill.Category + "|" + skill.Skill };
            checkedNodes.push(checkedNode);
        }

        // Create a data source
        var ds = ctrlSkillsTree.ConvertCheckedNodesToDataSet(checkedNodes, true);

        // Sort the old and new tree roots
        ds.sort(function (a, b)
        {
            return (a.text > b.text);
        });

        // Add it to the destination tree
        var sSuffix = '-' + parentDiv;
        ctrlSkillsTree.AddSkillsDataSetToDestination(sSuffix, ds);

        // Remove these skills from source also
        var sourceTreeview = $("#ctrlSkillsTree-Source" + sSuffix).data("kendoTreeView");
        ctrlSkillsTree.RemoveNodes(sourceTreeview, sourceTreeview.dataSource.view(), checkedNodes);
    },

    RemoveNodes: function (treeview, nodes, removeNodes)
    {
        for (var i = 0; i < nodes.length; i++)
        {
            var node = nodes[i];

            var bRemoveNode = false;
            for (var r = 0; r < removeNodes.length; r++) 
            {
                var removeItem = removeNodes[r];
                if (node.id == removeItem.id)
                    bRemoveNode = true;
            }

            if(bRemoveNode)
            {
                var item = treeview.findByUid(node.uid);
                treeview.remove(item);
            }            
            else if (node.hasChildren)
            {
                ctrlSkillsTree.RemoveNodes(treeview, node.children.view(), removeNodes);
            }
        }
    },

    // Called by TriSysSDK.Attributes.AfterControlLoaded event to change div ID's as we will
    // have multiple versions of this control loaded simultaneously.
    PostLoad: function(parentDiv)
    {
        var sIDSuffix = '-' + parentDiv;

        // Change ID of all internal divs
        var controls = ['ctrlSkillsTree-Source', 'ctrlSkillsTree-Destination', 'ctrlSkillsTree-AddSelectedSkills', 'ctrlSkillsTree-RemoveSelectedSkills'];
        for (var i in controls) {
            $('#' + controls[i]).attr('id', controls[i] + sIDSuffix);
        }

        // Set onclick events for buttons
        $('#ctrlSkillsTree-AddSelectedSkills' + sIDSuffix).on('click', function()
        {
            TriSysApex.ControlPopulationDirty.SetDirty(parentDiv, true);
            ctrlSkillsTree.AddSelectedSkills(sIDSuffix);
        });
        $('#ctrlSkillsTree-RemoveSelectedSkills' + sIDSuffix).on('click', function ()
        {
            TriSysApex.ControlPopulationDirty.SetDirty(parentDiv, true);
            ctrlSkillsTree.RemoveSelectedSkills(sIDSuffix);
        });
    },

    // Called by 'save' functions (e.g. Task.SaveAndCloseButtonClick) to read all skill records
    ReadSkills: function(sParentDiv)
    {
        var skillList = null;
        var nodes = ctrlSkillsTree.ReadDestinationItems(sParentDiv);
        if(nodes)
        {
            if (nodes.length == 0)
            {
                // There were items, and they were deleted
                skillList = [];
                return skillList;
            }

            // Convert nodes into skill records
            var skills = TriSysApex.Cache.Skills();
            for (var i = 0; i < nodes.length; i++)
            {
                var node = nodes[i];
                var sID = node.id;
                if (sID)
                {
                    var sParts = sID.split("|");
                    var sCategory = sParts[0];
                    var sSkill = sParts[1];

                    for (var s = 0; s < skills.length; s++)
                    {
                        var skill = skills[s];
                        if (skill.Category.trim() == sCategory.trim() && skill.Skill == sSkill)
                        {
                            if (!skillList)
                                skillList = [];
                            skillList.push(skill);
                            break;
                        }
                    }                    
                }
            }
        }

        return skillList;
    },

    // 14 Mar 2024: Allow filtering of categories and skills
    LoadObjectFilter: function(sSuffix)
    {
        // Rename ctrlSkillsTree-object-search to ctrlSkillsTree-object-search + sSuffix as there could be more than one loaded at a time
        var sID = 'ctrlSkillsTree-object-search';
        var sFilterID = sID + sSuffix;
        $('#' + sID).attr('id', sFilterID);

        var txtFilter = $('#' + sFilterID);
        txtFilter.off().keyup(function (e)
        {
            // In-Memory filter is every keystroke, not on enter
            if (e.keyCode != 13) {
                sFilter = txtFilter.val();
                ctrlSkillsTree.FilterObjects(sFilter, sSuffix);
            }
        });
    },

    FilterObjects: function (sFilter, sSuffix)
    {
        //TriSysApex.Toasters.Success(sFilterID + ": " + sFilter);

        if (sFilter)
            sFilter = sFilter.toLowerCase();

        ctrlSkillsTree.FilterObjectsBeneathRoot('ctrlSkillsTree-Source' + sSuffix, sFilter);
        ctrlSkillsTree.FilterObjectsBeneathRoot('ctrlSkillsTree-Destination' + sSuffix, sFilter);
    },

    FilterObjectsBeneathRoot: function (sDOMRootId, sFilter)
    {
        // Find all <li> elements containing text that matches "SEARCH" beneath <div id="root">
        //$('#' + sDOMRootId).find('li.k-item:contains("' + sFilter + '")').show();
        $('#' + sDOMRootId + ' li.k-item').each(function ()
        {
            var spanText = $(this).find('span.k-in').text();
            //console.log(spanText);

            if (spanText)
            {
                spanText = spanText.toLowerCase();

                //var $li = $(this);
                //var $kIn = $li.find('span.k-in');

                //var sLiText = $li.text().toLowerCase();
                //var sKinText = $kIn.text().toLowerCase();

                //if (sKinText.includes(sFilter)) {
                //    // Show the current node and all its ancestors
                //    $li.parents('li.k-item').show();
                //} else {
                //    // Hide the current node and all its descendants
                //    $li.hide();
                //}

                //var $li = $(this);
                //var $kIn = $li.find('span.k-in');

                //var sLiText = $li.text().toLowerCase();
                //var sKinText = $kIn.text().toLowerCase();


                //if (sLiText.indexOf(sFilter) >= 0 && sKinText.indexOf(sFilter) < 0)
                //{
                //    $kIn.show();  // Show the child <span class="k-in"> if the parent <li> contains the filter text but the child does not
                //    $li.find('li.k-item').show(); // Show all child <li> items
                //}
                //else if (sKinText.indexOf(sFilter) >= 0)
                //{
                //    $li.show();   // Show the parent <li> if the child <span class="k-in"> contains the filter text
                //}
                //else {
                //    $li.hide();   // Hide otherwise
                //}

                // Works
                if (spanText.indexOf(sFilter) >= 0) {
                    //console.log("Showing item for " + spanText);
                    $(this).show();  // Show if <span class="k-in"> contains "GNVQ"
                } else {
                    //console.log("NOT showing item for " + spanText + " for filter: " + sFilter);
                    $(this).hide();  // Hide otherwise
                }
            }

        });
        return;


        //var table = document.getElementById(sDOMRootId);
        //var tr = table.getElementsByTagName("tr");
        //for (var i = 0; i < tr.length; i++)
        //{
        //    var bShowRow = sFilter ? false : true;

        //    for (var c = 0; c < 3; c++) {
        //        var td = tr[i].getElementsByTagName("td")[c];
        //        if (td) {
        //            if (td.innerText && td.style.display != 'none') {
        //                if (td.innerText.toLowerCase().indexOf(sFilter) >= 0)
        //                    bShowRow = true;
        //            }
        //        }
        //    }

        //    tr[i].style.display = bShowRow ? "" : "none";
        //    iShown += (bShowRow ? 1 : 0);
        //}
    }

};  // ctrlSkillsTree

