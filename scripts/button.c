#include <bcm2835.h>
#include <stdio.h>

// Input on RPi pin GPIO 11
#define PIN RPI_V2_GPIO_P1_11 
int main()
{
    
    if (!bcm2835_init())
        return 1;
    // Set RPI pin P1-15 to be an input
    bcm2835_gpio_fsel(PIN, BCM2835_GPIO_FSEL_INPT);
    //  pull to off
    bcm2835_gpio_set_pud(PIN, BCM2835_GPIO_PUD_OFF);
    
    while (1)
    {  
        // read data from Raspi PIN
        uint8_t value = bcm2835_gpio_lev(PIN);   
         
        // logical 1 from PIN
        if(value) 
        {  
            delay(50);  // noise remove
            if(bcm2835_gpio_lev(PIN))    
            {
                // init counter for differentiate hold/push button
                int counter = 0;    
                while(bcm2835_gpio_lev(PIN))
                {     
                    delay(200);
                    counter++;           
                }      
                if(counter >= 10)
                {
                    printf("btn_hold\t");     // button holded 2 seconds  
                }
                else
                {
                    printf("btn_push\t");     // button pushed 
                }
            fflush(stdout);
            //delay to ignore repeating button push in short time
            delay(5000);    
            }              
        }             
    }
bcm2835_close();
return 0;
}

