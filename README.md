# GoogleCalendarAddon

## Plugin development

### Source code
The plugin code exists in 2 places:
1. A Google App Script (GAS) project
2. This Git repository

The GAS project doesn't currently support full version control, only the latest code can be viewed there (Note: the clasp CLI allows cloning/pulling a specific version)
Therefore, we also keep the code in this repository to track changes over time.

### Updating the code
Prerequisite: [setup clasp](#First-setup-with-clasp)

1. Change the files in your local environment
2. Update the files in the GAS project 
            
       clasp push
3. Create a new version and note the created version number

       clasp version <description of the version>
4. Commit the changes with Git and create a PR
5. Merge the PR
6. Now, there are two options to deploy
   1. By updating the version for an existing deployment (i.e., keep the current deployment ID):

          clasp deploy -V <the existing deployement ID> -i <the new version previously created>
   2. Or by creating a new deployment:
      1. Create the deployment:

             clasp deploy -V <the existing deployement ID>
      2. Update the deployment in the App Configuration page of the Google Workspace Marketplace SDK. 
      This is explained on [this documentation page](https://developers.google.com/apps-script/add-ons/how-tos/update-published-add-on).
### First setup with clasp
1. Install clasp. Currently, it's done by

       npm install -g @google/clasp

   For the latest instructions, check [the clasp repo](https://github.com/google/clasp).
2. To authorize clasp to for work with your user, run from any folder in the terminal

       clasp login

3. To verify to authentication worked and that you can access the plugin, 
you should see "Gong for Google..." when you run

       clasp list
