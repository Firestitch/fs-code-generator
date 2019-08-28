import { Request, Response } from 'express';
import { createWriteStream } from 'fs';
import { exec, spawn, execFileSync } from 'child_process';
import { ListCreationType } from '../common/list-creation-type';
import { findAllModules, findAllServices, getFileContent } from '../helpers';
import * as path from 'path';
import { getEnumKeysList } from '../helpers/get-enum-keys-list';
import { findAllEnums } from '../helpers/find-all-enums';
import { fixErrorResponseMessage } from '../helpers/fix-error-response-message';

/**
 * GET /
 * Home page.
 */
export let index = (req: Request, res: Response) => {

  const execHandler = (err: any, stdout: any, stderr: any) => {
    if (err) {
      res.status(500).json({
        message: fixErrorResponseMessage(stderr)
      });
    } else {
      res.json({
        message: stdout
      })
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  };

  const params = req.body;

  if (!params.module) {
    res.status(400).json({
      message: 'Module requierd'
    });

    return;
  }

  let command = `\
  --name=${params.componentName} \
  --module=${params.module.moduleName} \
  --path=${params.module.modulePath} \
  --type=${params.componentType}`;

  let schema = '';

  switch (params.interfacePattern) {
    case ListCreationType.list: {
      schema = 'list';
      command += `\
      --service=${params.service.singularName} \
      --servicePath=${params.service.servicePath} \
      --pluralModel=${params.pluralModelName} \
      --singleModel=${params.singularModelName}`
    } break;

    case ListCreationType.listCreateEdit: {
      schema = 'list';
      command += `\
      --mode=${params.createEditInterfacePattern}\
      --parentName=${params.componentName} \
      --singleName=${params.createEditComponentName} \
      --service=${params.service.singularName} \
      --servicePath=${params.service.servicePath} \
      --pluralModel=${params.pluralModelName} \
      --singleModel=${params.singularModelName}`;
    } break;

    case ListCreationType.CreateEdit: {
      if (params.createEditInterfacePattern === 'dialog') {
        schema = 'list-create-dialog';
      } else {
        schema = 'list-create';
      }

      command = `\
      --mode=${params.createEditInterfacePattern}\
      --module=${params.module.moduleFullPath} \
      --secondLevel=true \
      --path=${params.module.modulePath} \
      --parentName=${params.componentName} \
      --parentType=${params.relatedParentType} \
      --name=${params.createEditComponentName} \
      --service=${params.service.singularName} \
      --servicePath=${params.service.servicePath} \
      --singleModel=${params.singularModelName} \
      --type=${params.componentType}`;
    } break;

    case ListCreationType.Basic: {
      schema = 'base';
    }
  }

  console.log(`ng g @firestitch/schematics:${schema} ${command}`);
  exec(`ng g @firestitch/schematics:${schema} ${command}`, execHandler);
};

/**
 * GET /create-enum
 */
export let createEnum = (req: Request, res: Response) => {

  const execHandler = (err: any, stdout: any, stderr: any) => {
    if (err) {
      res.status(500).json({
        message: fixErrorResponseMessage(stderr)
      });
    } else {
      const currentPath = path.relative(process.cwd(), 'src');
      const modulePath = params.module.modulePath.replace('/src/', '');
      const filePath = `${currentPath}/${modulePath}/enums/${params.name}.enum.ts`;

      getFileContent(filePath).then((content) => {
        res.json({
          code: content,
          path: `src/${modulePath}/enums/${params.name}.enum.ts`,
        })
      });
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  };

  const params = req.body;

  if (!params.name || !params.module) {
    res.status(400).json({
      message: 'Component and Module are requierd'
    });

    return;
  }

  const keys: any = [];
  const values: any = [];

  params.enums.forEach((en: any) => {
    keys.push(en.name);
    values.push(en.value);
  });

  let command = `\
  --name=${params.name} \
  --path=${params.module.modulePath} \
  --keys=${keys.join()} \
  --values=${values.join()}`;

  const schema = 'enum';

  console.log(`ng g @firestitch/schematics:${schema} ${command}`);
  exec(`ng g @firestitch/schematics:${schema} ${command}`, execHandler);
};

export let createConst = (req: Request, res: Response) => {

  const execHandler = (err: any, stdout: any, stderr: any) => {
    if (err) {
      res.status(500).json({
        message: fixErrorResponseMessage(stderr)
      });
    } else {
      const currentPath = path.relative(process.cwd(), 'src');
      const modulePath = params.module.modulePath.replace('src/', '');
      const filePath = `${currentPath}/${modulePath}/consts/${params.name}.const.ts`;

      getFileContent(filePath).then((content) => {
        res.json({
          code: content,
          path: `src/${modulePath}/consts/${params.name}.const.ts`,
        })
      });
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  };

  const params = req.body;

  if (!params.name || !params.module) {
    res.status(400).json({
      message: 'Component and Module are requierd'
    });

    return;
  }

  const keys: any = [];
  const values: any = [];

  let idx = 0;
  params.enumData.members.forEach((en: any) => {
    keys.push(en);
    values.push(params.consts[idx]);
    idx++;
  });

  let command = `\
  --name=${params.name} \
  --path=${params.module.modulePath} \
  --enumName=${params.enumData.name} \
  --enumPath=${params.enum.enumFullPath} \
  --keys=${keys.join()} \
  --values=${values.join()}`;

  const schema = 'const';

  console.log(`ng g @firestitch/schematics:${schema} ${command}`);
  exec(`ng g @firestitch/schematics:${schema} ${command}`, execHandler);
}

export let modulesList = (req: Request, res: Response) => {
  const currentPath = path.relative(process.cwd(), 'src');

  findAllModules(currentPath).then((modules) => {
    try {
      res.json({
        modules: modules
      });

    } catch (err) {
      res.status(500).json({
        message: err
      });
    }
  });
};

export let servicesList = (req: Request, res: Response) => {
  const currentPath = path.relative(process.cwd(), 'src');

  findAllModules(currentPath).then((modules) => {
    findAllServices(modules).then((services) => {
      try {
        res.json({
          services: services
        });

      } catch (err) {
        res.status(500).json({
          message: fixErrorResponseMessage(err)
        });
      }
    });
  });
  // exec(`ng g @firestitch/schematics:services-list`, (err, stdout, stderr) => {
  //   if (err) {
  //     res.status(500).json({
  //       message: stderr
  //     });
  //   } else {
  //     const str = stdout.replace('Nothing to be done.', '');
  //
  //     try {
  //       const list = JSON.parse(str);
  //
  //       res.json({
  //         services: list
  //       });
  //     } catch (e) {
  //       res
  //         .status(500)
  //         .json({
  //           message: e,
  //           target: str
  //         }) ;
  //     }
  //   }
  //   console.log(`stdout: ${stdout}`);
  //   console.log(`stderr: ${stderr}`);
  // });
};

export let generateService = (req: Request, res: Response) => {
  const execHandler = (err: any, stdout: any, stderr: any) => {
    if (err) {
      res.status(500).json({
        message: fixErrorResponseMessage(stderr)
      });
    } else {
      res.json({
        message: stdout
      })
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  };

  const params = req.body;

  if (!params.singularName || !params.pluralName || !params.module) {
    res.status(400).json({
      message: 'Name and Module are required'
    });

    return;
  }

  let command = `\
  --name=${params.singularName} \
  --module=${params.module.moduleName} \
  --path=${params.module.modulePath} \
  --subdirectory=${params.subdirectory} \
  --pluralName=${params.pluralName} \
  --menuService`;

  let schema = 'service';

  console.log(`ng g @firestitch/schematics:${schema} ${command}`);
  exec(`ng g @firestitch/schematics:${schema} ${command}`, execHandler);

};

export let generateModule = (req: Request, res: Response) => {
  const execHandler = (err: any, stdout: any, stderr: any) => {
    if (err) {
      res.status(500).json({
        message: fixErrorResponseMessage(stderr)
      });
    } else {
      res.json({
        message: stdout
      })
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  };

  const params = req.body;
  console.log(params);

  if (!params.name) {
    res.status(400).json({
      message: 'Name is required'
    });

    return;
  }

  const command = `\
  --name=${params.name} \
  --path=${params.module.modulePath} \
  --module=${params.module.moduleName} \
  --routing=${params.routing}`;

  const schema = 'module';

  exec(`ng g @firestitch/schematics:${schema} ${command}`, execHandler);
};

export let enumKeysList = (req: Request, res: Response) => {
  const params = req.query;

  if (!params.enumPath) {
    res.status(400).json({
      message: 'Name is required'
    });
  }

  const currentPath = path.relative(process.cwd(), params.enumPath);

  try {
    getEnumKeysList(currentPath).then((data) => {
      res.json(data);
    });
  } catch (e) {
    res.status(500).json({
      message: e
    });
  }
};

export let enumsList = (req: Request, res: Response) => {
  const params = req.query;

  if (!params.enumPath) {
    res.status(400).json({
      message: 'Name is required'
    });
  }

  const currentPath = path.relative(process.cwd(), params.enumPath + '/enums');

  try {
    findAllEnums(currentPath).then((data) => {
      res.json(data);
    });
  } catch (e) {
    res.status(500).json({
      message: e
    });
  }
};
