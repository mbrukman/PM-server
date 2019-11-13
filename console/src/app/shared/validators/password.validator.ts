import { Validators } from '@angular/forms';

export const passwordValidator = Validators.pattern('^(?=.*[0-9]+.*)(?=.*[a-zA-Z]+.*)[0-9a-zA-Z]{8,}$');
