// Self contained logic for populating the document library grid
//
var ctrlCompanyOrganogram =
{
    DivTag: null,       // There is only one of these in the framework

    // Called by TriSysSDK.CompanyOrganogram.AfterControlLoaded event to populate the contact hierarchy
    PostLoad: function (lCompanyId, parentDiv)
    {
        ctrlCompanyOrganogram.RetainedContactHierarchy = null;

        ctrlCompanyOrganogram.DivTag = parentDiv;
        TriSysApex.ControlPopulationDirty.ClearPopulationAndDirtyStatus(ctrlCompanyOrganogram.DivTag);

        if (lCompanyId > 0)
            ctrlCompanyOrganogram.ReadFromWebAPI(lCompanyId);


        // Load the special file menu to control the chart
        //var callbackMenuItems = ['company-organogram-file-menu-add-existing', 'company-organogram-file-menu-add-all', 'company-organogram-file-menu-clear-all'];
        //TriSysSDK.FormMenus.DrawFileMenuFromTemplate('CompanyOrganogramFileMenu', null, 'ctrlCompanyOrganogramFileMenu.html',
        //    ctrlCompanyOrganogram.FileMenuItemSelectionCallback, callbackMenuItems);

        // Themes again
        setTimeout(TriSysProUI.kendoUI_Overrides, 100);

        return;

        //#region Test stuff
        var lCompanyId = TriSysApex.Pages.CompanyForm.CompanyId;
        var company = { CompanyId: lCompanyId, Name: "Althorp", Industry: "Stately Home", TelNo: "01278 827 872", WebSite: "www.althorp-estate.uk.org" };
        var hierarchy = ctrlCompanyOrganogram.FakePopulationFromWebAPI();
        ctrlCompanyOrganogram.PopulateDOM(company, hierarchy);

        // Do the third party magic
        ctrlCompanyOrganogram.InvokeOrganogramRocketScience();
        //#endregion Test stuff
    },

    //#region Test stuff #2
    FakePopulationFromWebAPI: function()
    {
        var hierarchy = [];

        var Tony = { ContactId: 1, FullName: "Tony Mandridge", Image: "http://www.trisys.co.uk/img/staffpictures/gl.png", JobTitle: "Founder &amp; CEO", City: "Cambridge", EMail: "tony@althorp.com", TelNo: "01223 564 4567", ParentContactId: 0 };
        hierarchy.push(Tony);

        var Jodie = { ContactId: 2, FullName: "Jodie Marsh", Image: "http://www.trisys.co.uk/img/staffpictures/jp.png", JobTitle: "Business Analyst", EMail: "jodie@althorp.com", TelNo: "01223 564 4567", ParentContactId: 1 };
        hierarchy.push(Jodie);

        var Pingu = { ContactId: 3, FullName: "Pingu Gringo", Image: "http://www.trisys.co.uk/img/staffpictures/pe.png", JobTitle: "IT Manager", City: "Cambridge", EMail: "pingu@althorp.com", TelNo: "01223 564 4567", ParentContactId: 1 };
        hierarchy.push(Pingu);

        var Jimmy = { ContactId: 4, FullName: "Jimmy Dean", Image: "http://www.trisys.co.uk/img/staffpictures/ja.png", JobTitle: "Developer", City: "Cambridge", EMail: "jimmmy@althorp.com", TelNo: "01223 564 4567", ParentContactId: 3 };
        hierarchy.push(Jimmy);

        return hierarchy;
    },
    //#endregion Test stuff #2

    ReadFromWebAPI: function (lCompanyId)
    {
        var CCompanyReadOrganogramRequest = { CompanyId: lCompanyId };
        var payloadObject = {};

        payloadObject.URL = "Company/ReadOrganogram";

        payloadObject.OutboundDataPacket = CCompanyReadOrganogramRequest;

        payloadObject.InboundDataFunction = function (data)
        {
            TriSysApex.UI.HideWait();

            var CCompanyReadOrganogramResponse = data;

            if (CCompanyReadOrganogramResponse)
            {
                if (CCompanyReadOrganogramResponse.Success)
                {
                    ctrlCompanyOrganogram.PopulateAndDrawOrganogram(CCompanyReadOrganogramResponse);
                    TriSysApex.ControlPopulationDirty.SetPopulated(ctrlCompanyOrganogram.DivTag, true);
                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CCompanyReadOrganogramResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlCompanyOrganogram.ReadFromWebAPI: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Company Hierarchy...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    PopulateAndDrawOrganogram: function (CCompanyReadOrganogramResponse)
    {
        var company = {
            CompanyId: CCompanyReadOrganogramResponse.CompanyId,
            Name: CCompanyReadOrganogramResponse.Name,
            Industry: CCompanyReadOrganogramResponse.Industry,
            TelNo: CCompanyReadOrganogramResponse.TelNo,
            WebSite: CCompanyReadOrganogramResponse.WebSite,
            Image: CCompanyReadOrganogramResponse.Image
        };

        var hierarchy = [];

        if (CCompanyReadOrganogramResponse.Contacts)
        {
            for (var i = 0; i < CCompanyReadOrganogramResponse.Contacts.length; i++)
            {
                var contact = CCompanyReadOrganogramResponse.Contacts[i];
                hierarchy.push(contact);
            }
        }

        // Retain the contact hierarchy in memory
        ctrlCompanyOrganogram.RetainedContactHierarchy = hierarchy;

        // Populate the DOM with the hierarchy
        ctrlCompanyOrganogram.PopulateCompanyInDOM(company);
        ctrlCompanyOrganogram.PopulateContactsDOM(hierarchy);

        // Do the third party magic to render the org chart
        ctrlCompanyOrganogram.InvokeOrganogramRocketScience();
    },

    // Retain in memory after population from wbe api
    RetainedContactHierarchy: null,

    PopulateCompanyInDOM: function(company)
    {
        var sRootFile = TriSysApex.Constants.UserControlFolder + 'ctrlCompanyOrganogramRoot.html';
        var sRootTemplate = TriSysApex.NavigationBar.TemplateFile(sRootFile);

        // Draw the company root node
        var sImage = company.Image;
        if (!sImage)
            sImage = TriSysApex.Constants.DefaultCompanyImage;

        sRootTemplate = sRootTemplate.replace('##company-photo##', sImage);
        sRootTemplate = sRootTemplate.replace(/##company-id##/g, company.CompanyId);
        sRootTemplate = sRootTemplate.replace(/##company-name##/g, company.Name);
        sRootTemplate = sRootTemplate.replace(/##company-industry##/g, company.Industry);
        sRootTemplate = sRootTemplate.replace(/##company-telno##/g, company.TelNo);
        sRootTemplate = sRootTemplate.replace(/##company-website##/g, company.WebSite);

        $('#trisys-organogram-hierarchy').append(sRootTemplate);
    },

    PopulateContactsDOM: function (hierarchy)
    {
        // Clear out all previous DOM hierarchy beneath the company
        $('#trisys-org-contact-list').empty();

        try
        {
            // Get the HTML templates for drawing the DOM hierarchy
            var sFile = TriSysApex.Constants.UserControlFolder + 'ctrlCompanyOrganogramNode.html';
            var sNodeTemplate = TriSysApex.NavigationBar.TemplateFile(sFile);

            // Hierarchy is in no particular order, hence we need to do this based on parent/child

            // Find contacts who have no parents and are thus created as a node beneath the company node
            for (var iTopNode = 0; iTopNode < hierarchy.length; iTopNode++)
            {
                var contact = hierarchy[iTopNode];

                // Mark as non-drawn so that we can easily enumerate until every contact is displayed
                contact.Drawn = false;

                if (contact.ParentContactId == 0)
                {
                    // Merge this contact details into the HTML node template
                    var sNode = ctrlCompanyOrganogram.CreateContactNodeLI(contact, sNodeTemplate);

                    // Insert to end of nodes after company node
                    $('#trisys-org-contact-list').append(sNode);

                    // Mark as drawn so that we can easily enumerate until every contact is displayed
                    contact.Drawn = true;
                }
            }

            // Now enumerate and draw all nodes until every contact has been drawn
            var moreNodesToBeDrawn = true;
            var iMaxIterations = 32;
            var iIterationCounter = 0;
            while (moreNodesToBeDrawn && iIterationCounter < iMaxIterations)
            {
                iIterationCounter += 1;

                for (var iNode = 0; iNode < hierarchy.length; iNode++)
                {
                    var contact = hierarchy[iNode];
                    if (!contact.Drawn && contact.ParentContactId > 0)
                    {
                        // Merge this contact details into the HTML node template
                        var sNode = ctrlCompanyOrganogram.CreateContactNodeLI(contact, sNodeTemplate);

                        // Insert to end of nodes after the parent node
                        var parentUL = $('#trisys-org-contact-staff-of-' + contact.ParentContactId);
                        if (parentUL.length > 0)
                        {
                            parentUL.append(sNode);

                            // Mark as drawn so that we can easily enumerate until every contact is displayed
                            contact.Drawn = true;
                        }
                    }
                }

                // Do we need to go around again?
                moreNodesToBeDrawn = false;
                for (var iNode = 0; iNode < hierarchy.length; iNode++)
                {
                    var contact = hierarchy[iNode];
                    if (!contact.Drawn)
                        moreNodesToBeDrawn = true;
                }
            }

        } catch (e)
        {
            // Found nasty hanging on 25 June 2015
            TriSysApex.Logging.LogMessage(e.message);
        }
        return;

        // Test populate
        var lContactId = 98765;
        sNode = sNode.replace('##contact-photo##', 'http://www.trisys.co.uk/img/staffpictures/ja.png');
        sNode = sNode.replace(/##contact-id##/g, lContactId);
        sNode = sNode.replace('##contact-name##', 'jimmy Dean');
        sNode = sNode.replace('##contact-jobtitle##', 'Propeller Head');
        sNode = sNode.replace('##contact-city##', 'Aberdeen');
        sNode = sNode.replace('##contact-email##', 'skenken@althorp.com');
        sNode = sNode.replace('##contact-telno##', '01234 567 890');

        // Test add to known DIV tag
        sNode = '<li id="trisys-org-contactid-' + lContactId + '" >' + sNode + '</li>';

        // Insert to beginning of nodes after company node
        $('#trisys-org-contact-list').prepend(sNode);
    },

    CreateContactNodeLI: function(contact, sNode)
    {
        var sLI = '<li id="trisys-org-contactid-' + contact.ContactId + '">';

        var sImage = contact.Image;
        if (!sImage)
            sImage = TriSysApex.Constants.DefaultContactImage;

        sNode = sNode.replace('##contact-photo##', sImage);
        sNode = sNode.replace(/##contact-id##/g, contact.ContactId);
        sNode = sNode.replace('##contact-name##', contact.FullName);
        sNode = sNode.replace('##contact-jobtitle##', contact.JobTitle);
        sNode = sNode.replace('##contact-city##', contact.City);
        sNode = sNode.replace('##contact-email##', contact.EMail);
        sNode = sNode.replace('##contact-telno##', contact.TelNo);

        // Add a placeholder for all staff who report to this contact to be added
        var sPlaceholder = '<ul id="trisys-org-contact-staff-of-' + contact.ContactId + '"></ul>';

        return sLI + sNode + sPlaceholder + '</li>';
    },

    // After we populated the DOM with LI/UL elements, get the JOrgChart to draw it
    // and handle editing.
    InvokeOrganogramRocketScience: function()
    {
        try
        {
            // Clear all sub nodes
            $('#trisys-organogram-rendered-chart').empty();

            // Re-instantiate
            $("#trisys-organogram-hierarchy").jOrgChart({
                chartElement: '#trisys-organogram-rendered-chart',
                dragAndDrop: true
            });

            TriSysSDK.CompanyOrganogram.ApplyCSSColours();
        }
        catch(err)
        {
            TriSysApex.UI.ShowError(err);
        }
    },
    
    // May be called MULTIPLE times for each node which is relocated.
    // Therefore this IS NOT the place to update the database!
    //
    AfterNodeRelocation: function (sDOM_HTML)
    {
        // Display the actual LI/UL/TABLE
        //TriSysApex.UI.ShowMessage(sDOM_HTML);

        // Mark the control as dirty
        TriSysApex.ControlPopulationDirty.SetDirty(ctrlCompanyOrganogram.DivTag, true);

        var domHierarchy = [];

        // Enumerate through the DOM and get the hierarchy based on ID's
        var lCompanyId = TriSysApex.Pages.CompanyForm.CompanyId;
        var companyLI = $('#trisys-org-companyid-' + lCompanyId);   

        // Recursive call
        ctrlCompanyOrganogram.RecursiveHierarchyEnumeration(companyLI, 0, domHierarchy);

        // Update the retained structure
        var hierarchy = ctrlCompanyOrganogram.RetainedContactHierarchy
        var iRemoveIndex = -1;

        for (var i = 0; i < hierarchy.length; i++)
        {
            var contact = hierarchy[i];

            // Find all children and re-point
            for (var j = 0; j < domHierarchy.length; j++)
            {
                var contact2 = domHierarchy[j];
                if (contact2.ContactId == contact.ContactId)
                    contact.ParentContactId = contact2.ParentContactId;
            }
        }

        // Debugging display
        //var sDisplay = JSON.stringify(domHierarchy);
        //var sDisplay2 = JSON.stringify(hierarchy);
        //TriSysApex.UI.ShowMessage(sDisplay + '<br />' + sDisplay2);
    },

    // The recursive function called for each contact to find all contacts who 
    // report into this contact
    RecursiveHierarchyEnumeration: function(li, lParentContactId, domHierarchy)
    {
        var ul = li.find('ul');
        if(ul)
        {
            ul.each(function ()
            {
                // Find all li in this ul
                var ulInstance = $(this);
                var liList = ulInstance.find('li');

                liList.each(function ()
                {
                    // Enumerate each li
                    var liInstance = $(this);

                    var sContactID = liInstance.attr('id');
                    if (sContactID)
                    {
                        var lContactId = ctrlCompanyOrganogram.ParseContactIdFromNodeId(sContactID);

                        // Add to hierarchy
                        ctrlCompanyOrganogram.AddContactToHierarchyArray(lContactId, lParentContactId, domHierarchy);

                        // Find more children
                        ctrlCompanyOrganogram.RecursiveHierarchyEnumeration(liInstance, lContactId, domHierarchy);
                    }
                });
            });
        }
    },

    // The JQuery DOM functions are recursive however we want to read it non-recursively.
    // Take account therefore of this by stopping duplicates.
    AddContactToHierarchyArray: function (lContactId, lParentContactId, domHierarchy)
    {
        var bFound = false;
        for (var i = 0; i < domHierarchy.length; i++)
        {
            var item = domHierarchy[i]
            if(item.ContactId == lContactId)
            {
                bFound = true;
                break;
            }
        }

        if (!bFound)
        {
            var contact = { ContactId: lContactId, ParentContactId: lParentContactId };
            domHierarchy.push(contact);
        }
    },
    
    // Parse <li id="trisys-org-contactid-12345">
    ParseContactIdFromNodeId: function(sLIid)
    {
        var parts = sLIid.split('-contactid-');
        return parts[1];
    },

    // When the user clicks on the close cross icon top right of the node
    DeleteContact: function (lContactId)
    {
        //TriSysApex.UI.ShowMessage("DeleteNode: " + lContactId);

        // Find the contact in the hierarchy and re-point any children to its parent, then remove
        var hierarchy = ctrlCompanyOrganogram.RetainedContactHierarchy
        var iRemoveIndex = -1;

        for (var i = 0; i < hierarchy.length; i++)
        {
            var contact = hierarchy[i];
            if(contact.ContactId == lContactId)
            {
                iRemoveIndex = i;

                // Find all children and re-point
                for (var j = 0; j < hierarchy.length; j++)
                {
                    var contact2 = hierarchy[j];
                    if (contact2.ParentContactId == contact.ContactId)
                        contact2.ParentContactId = contact.ParentContactId;
                }
            }
        }

        if(iRemoveIndex >= 0)
        {
            // Mark the control as dirty
            TriSysApex.ControlPopulationDirty.SetDirty(ctrlCompanyOrganogram.DivTag, true);

            // Remove from the array
            hierarchy.splice(iRemoveIndex, 1);

            // Populate the DOM contacts without the deleted contact and re-parenting of its children
            ctrlCompanyOrganogram.PopulateContactsDOM(hierarchy);

            // Do the third party magic to render the org chart
            ctrlCompanyOrganogram.InvokeOrganogramRocketScience();
        }        
    },

    // User wishes to control the menu
    FileMenuItemSelectionCallback: function (sFileMenuID)
    {
        switch (sFileMenuID)
        {
            case 'company-organogram-file-menu-add-existing':
                ctrlCompanyOrganogram.SelectCompanyContact();
                break;

            case 'company-organogram-file-menu-add-all':
                ctrlCompanyOrganogram.SelectAllCompanyContactsNotInOrganogram();
                break;

            case 'company-organogram-file-menu-clear-all':
                ctrlCompanyOrganogram.ClearAllContacts();
                break;
        }

    },

    // User wishes to add an existing company contact to the organigram
    SelectCompanyContact: function()
    {
        var fnSelectCompanyContact = function (selectedRow)
        {
            if (!selectedRow)
                return;

            // Read the fields we require from the selected row
            var lContactId = selectedRow.ContactId;
            
            if (lContactId)
            {
                // Unfortunately, we do not get the correct fields, so do not add at this point
                //var sFullName = selectedRow.Contact_Forenames + ' ' + selectedRow.Contact_Surname;
                //var sJobTitle = selectedRow.JobTitle;
                //var sTelNo = selectedRow.WorkTelNo;
                //var sEMail = selectedRow.Email
                //var contact = { ContactId: lContactId, FullName: sFullName, Image: null, JobTitle: sJobTitle, City: null, EMail: sEMail, TelNo: sTelNo, ParentContactId: 0 };
                //ctrlCompanyOrganogram.AddUserSelectedContact(contact);

                // Instead, get all but filter to get the correct fields from the web service
                ctrlCompanyOrganogram.SelectAllCompanyContactsNotInOrganogram(lContactId);
            }

            return true;
        };

        var lCompanyId = TriSysApex.Pages.CompanyForm.CompanyId;
        var sCompany = $('#Company_Name').val();
        TriSysApex.ModalDialogue.CompanyContacts.Select(lCompanyId, sCompany, 0, fnSelectCompanyContact);


        // test
        //var Tony = { ContactId: 1, FullName: "Tony Mandridge", Image: "http://www.trisys.co.uk/img/staffpictures/gl.png", JobTitle: "Founder &amp; CEO", City: "Cambridge", EMail: "tony@althorp.com", TelNo: "01223 564 4567", ParentContactId: 0 };
        //ctrlCompanyOrganogram.AddUserSelectedContact(Tony);        
    },

    AddUserSelectedContact: function(contact)
    {
        // Is this a duplicate?
        var hierarchy = ctrlCompanyOrganogram.RetainedContactHierarchy;
        if (hierarchy)
        {
            var lstContacts = [];
            for (var i = 0; i < hierarchy.length; i++)
            {
                var existingContact = hierarchy[i];
                if (contact.ContactId == existingContact.ContactId)
                {
                    // Duplicate contact: note slight delay to allow selection dialogue to close first
                    setTimeout(function ()
                    {
                        TriSysApex.UI.ShowMessage("Contact: " + contact.FullName + " is already shown.");
                    }, 100);
                    return;
                }
            }
        }

        // Mark the control as dirty
        TriSysApex.ControlPopulationDirty.SetDirty(ctrlCompanyOrganogram.DivTag, true);

        // Add to existing contact list
        var hierarchy = ctrlCompanyOrganogram.RetainedContactHierarchy
        hierarchy.unshift(contact);

        // Populate the DOM contacts with the new contact
        ctrlCompanyOrganogram.PopulateContactsDOM(hierarchy);

        // Do the third party magic to render the org chart
        ctrlCompanyOrganogram.InvokeOrganogramRocketScience();
    },

    // User wants to add all existing company contacts which are not on the organigram.
    // Optional parameter for singleton to be added.
    SelectAllCompanyContactsNotInOrganogram: function (lContactIdOnly)
    {
        // Get a list of all contacts already in the chart
        var hierarchy = ctrlCompanyOrganogram.RetainedContactHierarchy;
        if (!hierarchy)
            return;

        var lstContacts =[];
        for (var i = 0; i < hierarchy.length; i++)
        {
            var contact = hierarchy[i];
            lstContacts.push(contact.ContactId);
        }

        // Send this to the web service to get a list of all other company contacts
        var lCompanyId = TriSysApex.Pages.CompanyForm.CompanyId;
        var CCompanyReadNonOrganogrammedContactsRequest = { CompanyId: lCompanyId, Contacts: lstContacts };
        var payloadObject = {};

        payloadObject.URL = "Company/ReadNonOrganogrammedContacts";

        payloadObject.OutboundDataPacket = CCompanyReadNonOrganogrammedContactsRequest;

        payloadObject.InboundDataFunction = function (data)
        {
            TriSysApex.UI.HideWait();

            var CCompanyReadNonOrganogrammedContactsResponse = data;

            if (CCompanyReadNonOrganogrammedContactsResponse)
            {
                if (CCompanyReadNonOrganogrammedContactsResponse.Success)
                {
                    if (CCompanyReadNonOrganogrammedContactsResponse.Contacts && CCompanyReadNonOrganogrammedContactsResponse.Contacts.length > 0)
                    {
                        TriSysApex.ControlPopulationDirty.SetDirty(ctrlCompanyOrganogram.DivTag, true);

                        // Add all contacts to our in-memory hierarchy, then re-draw it
                        var hierarchy = ctrlCompanyOrganogram.RetainedContactHierarchy

                        for (var i = 0; i < CCompanyReadNonOrganogrammedContactsResponse.Contacts.length; i++)
                        {
                            var contact = CCompanyReadNonOrganogrammedContactsResponse.Contacts[i];

                            var bAddToArray = true;
                            if (lContactIdOnly)
                            {
                                if (contact.ContactId != lContactIdOnly)
                                    bAddToArray = false;
                            }

                            if(bAddToArray)
                                hierarchy.unshift(contact);
                        }

                        // Populate the DOM contacts with the new contact
                        ctrlCompanyOrganogram.PopulateContactsDOM(hierarchy);

                        // Do the third party magic to render the org chart
                        ctrlCompanyOrganogram.InvokeOrganogramRocketScience();
                    }

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CCompanyReadNonOrganogrammedContactsResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlCompanyOrganogram.SelectAllCompanyContactsNotInOrganogram: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysApex.UI.ShowWait(null, "Reading Company Contacts...");
        TriSysAPI.Data.PostToWebAPI(payloadObject);
    },

    // User wants to clear all and start again
    ClearAllContacts: function()
    {
        ctrlCompanyOrganogram.RetainedContactHierarchy = [];
        var hierarchy = ctrlCompanyOrganogram.RetainedContactHierarchy;

        // Populate the DOM contacts with the new contact
        ctrlCompanyOrganogram.PopulateContactsDOM(hierarchy);

        // Do the third party magic to render the org chart
        ctrlCompanyOrganogram.InvokeOrganogramRocketScience();
    },

    // When the user saves the company record, we are explicitly called when we know that the organogram is dirty,
    // i.e. the user has made changes to it by moving or adding/deleting contacts.
    Save: function (lCompanyId)
    {
        var hierarchy = ctrlCompanyOrganogram.RetainedContactHierarchy;
        if (!hierarchy)
            return;

        // Convert the full data visual hierarchy into a sparse ID-only array
        var lstContacts = [];
        for (var i = 0; i < hierarchy.length; i++)
        {
            var contact = hierarchy[i];
            var sparseContact = { ContactId: contact.ContactId, ParentContactId: contact.ParentContactId };
            lstContacts.push(sparseContact);
        }

        var CCompanyWriteOrganogramRequest = { CompanyId: lCompanyId, Contacts: lstContacts };
        var payloadObject = {};

        payloadObject.URL = "Company/WriteOrganogram";

        payloadObject.OutboundDataPacket = CCompanyWriteOrganogramRequest;

        payloadObject.InboundDataFunction = function (data)
        {
            var CCompanyWriteOrganogramResponse = data;

            if (CCompanyWriteOrganogramResponse)
            {
                if (CCompanyWriteOrganogramResponse.Success)
                {
                    // Nothing visual other than re-setting the dirty flag
                    TriSysApex.ControlPopulationDirty.SetDirty(ctrlCompanyOrganogram.DivTag, false);

                    return;
                }
                else
                    TriSysApex.UI.ShowMessage(CCompanyWriteOrganogramResponse.ErrorMessage);
            }
        };

        payloadObject.ErrorHandlerFunction = function (request, status, error)
        {
            TriSysApex.UI.HideWait();
            TriSysApex.UI.errorAlert('ctrlCompanyOrganogram.Save: ' + status + ": " + error + ". responseText: " + request.responseText);
        };

        TriSysAPI.Data.PostToWebAPI(payloadObject);
    }

};     // ctrlCompanyOrganogram

